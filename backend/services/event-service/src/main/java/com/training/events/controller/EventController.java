package com.training.events.controller;

import com.training.events.entity.Event;
import com.training.events.entity.EventInteraction;
import com.training.events.entity.EventFeedback;
import com.training.events.entity.EventRegistration;
import com.training.events.entity.ProgramItem;
import com.training.events.repository.EventFeedbackRepository;
import com.training.events.repository.EventRegistrationRepository;
import com.training.events.repository.EventRepository;
import com.training.events.repository.EventInteractionRepository;
import com.training.events.security.JwtAuthenticationFilter;
import com.training.events.service.EventService;
import com.training.events.service.EventInteractionService;
import com.training.events.service.RecommendationService;
import com.training.events.dto.CreateEventRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventRepository eventRepository;
    private final EventRegistrationRepository registrationRepository;
    private final RestTemplate restTemplate;
    private final RecommendationService recommendationService;
    private final EventInteractionService interactionService;
    private final EventInteractionRepository interactionRepository;
    private final EventFeedbackRepository feedbackRepository;
    private final EventService eventService;

    public EventController(
            EventRepository eventRepository,
            EventRegistrationRepository registrationRepository,
            RestTemplate restTemplate,
            RecommendationService recommendationService,
            EventInteractionService interactionService,
            EventInteractionRepository interactionRepository,
            EventFeedbackRepository feedbackRepository,
            EventService eventService
    ) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.restTemplate = restTemplate;
        this.recommendationService = recommendationService;
        this.interactionService = interactionService;
        this.interactionRepository = interactionRepository;
        this.feedbackRepository = feedbackRepository;
        this.eventService = eventService;
    }

    private JwtAuthenticationFilter.JwtUserDetails getCurrentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getDetails() == null) return null;
        Object details = auth.getDetails();
        return details instanceof JwtAuthenticationFilter.JwtUserDetails
                ? (JwtAuthenticationFilter.JwtUserDetails) details
                : null;
    }

    private boolean isAdmin() {
        JwtAuthenticationFilter.JwtUserDetails u = getCurrentUser();
        return u != null && "ADMIN".equals(u.role);
    }

    private boolean isOwner(Event event) {
        JwtAuthenticationFilter.JwtUserDetails u = getCurrentUser();
        return u != null && event.getTrainerId().equals(u.userId);
    }

    private boolean canModify(Event event) {
        return isAdmin() || isOwner(event);
    }

    private Map<Long, Long> activeParticipantCountByEventId() {
        Collection<EventRegistration.RegistrationStatus> statuses = List.of(
                EventRegistration.RegistrationStatus.APPROVED,
                EventRegistration.RegistrationStatus.PENDING,
                EventRegistration.RegistrationStatus.ATTENDED
        );
        return registrationRepository.countByEventIdAndStatusIn(statuses).stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(
                        row -> ((Number) row[0]).longValue(),
                        row -> ((Number) row[1]).longValue(),
                        Long::sum
                ));
    }

    private void attachParticipantCounts(List<Event> events) {
        if (events == null || events.isEmpty()) return;
        Map<Long, Long> counts = activeParticipantCountByEventId();
        for (Event event : events) {
            event.setParticipantCount(counts.getOrDefault(event.getId(), 0L).intValue());
        }
    }

    private void attachParticipantCount(Event event) {
        if (event == null) return;
        attachParticipantCounts(List.of(event));
    }

    private void dispatchNotification(List<Long> recipientIds, String type, String title, String message, Long eventId) {
        if (recipientIds == null || recipientIds.isEmpty()) return;
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("recipientIds", recipientIds);
            payload.put("type", type);
            payload.put("title", title);
            payload.put("message", message);
            payload.put("eventId", eventId);
            restTemplate.postForObject("http://USER-SERVICE/api/users/internal/notifications/dispatch", payload, String.class);
        } catch (Exception e) {
            System.err.println(">>> [WARN] Notification dispatch failed: " + e.getMessage());
        }
    }

    private void grantXp(Long userId, String action, Long eventId) {
        if (userId == null || action == null || action.isBlank()) return;
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("userId", userId);
            payload.put("action", action);
            payload.put("eventId", eventId);
            restTemplate.postForObject("http://USER-SERVICE/api/users/internal/progress/xp-grant", payload, String.class);
        } catch (Exception e) {
            System.err.println(">>> [WARN] XP grant failed: " + e.getMessage());
        }
    }

    // ---- EVENTS ----

    // ---- PUBLIC ----
    @GetMapping
    public ResponseEntity<Page<Event>> listEvents(
            @RequestParam(required = false) Event.EventType type,
            @RequestParam(required = false) Event.EventMode mode,
            @RequestParam(required = false) Boolean upcomingOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, org.springframework.data.domain.Sort.by("dateStart").descending());
        return ResponseEntity.ok(eventService.listEvents(type, mode, upcomingOnly, pageRequest));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<List<Event>> recommendations(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "6") int limit
    ) {
        List<Event> recommendations = recommendationService.getRecommendations(userId, limit);
        attachParticipantCounts(recommendations);
        return ResponseEntity.ok(recommendations);
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<Event> getEvent(@PathVariable Long id) {
        return eventService.getEvent(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/interactions")
    public ResponseEntity<?> trackInteraction(@RequestBody InteractionRequest request) {
        JwtAuthenticationFilter.JwtUserDetails user = getCurrentUser();
        if (user == null || request == null || request.eventId() == null || request.type() == null) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Invalid interaction payload"));
        }

        Event event = eventRepository.findById(request.eventId()).orElse(null);
        if (event == null) {
            return ResponseEntity.notFound().build();
        }

        EventInteraction.InteractionType interactionType;
        try {
            interactionType = EventInteraction.InteractionType.valueOf(request.type().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Invalid interaction type"));
        }

        interactionService.track(user.userId, event, interactionType);
        return ResponseEntity.ok(java.util.Map.of("message", "Tracked"));
    }

    @PostMapping("/{id}/feedback")
    public ResponseEntity<?> submitFeedback(@PathVariable Long id, @RequestBody FeedbackRequest request) {
        JwtAuthenticationFilter.JwtUserDetails user = getCurrentUser();
        if (user == null || !"LEARNER".equalsIgnoreCase(user.role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(java.util.Map.of("message", "Learner only"));
        }
        if (request == null || request.difficulty() == null || request.understood() == null || request.rating() == null) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Missing feedback fields"));
        }
        if (request.rating() < 1 || request.rating() > 5) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "rating must be between 1 and 5"));
        }

        Event event = eventRepository.findById(id).orElse(null);
        if (event == null) return ResponseEntity.notFound().build();

        EventFeedback feedback = feedbackRepository.findByEventIdAndLearnerId(id, user.userId).orElseGet(EventFeedback::new);
        feedback.setEvent(event);
        feedback.setLearnerId(user.userId);
        try {
            feedback.setDifficulty(EventFeedback.Difficulty.valueOf(request.difficulty().toUpperCase()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Invalid difficulty"));
        }
        feedback.setUnderstood(request.understood());
        feedback.setRating(request.rating());
        feedback.setWhatNext(request.whatNext());
        feedbackRepository.save(feedback);
        grantXp(user.userId, "SUBMIT_FEEDBACK", event.getId());
        dispatchNotification(
                List.of(event.getTrainerId()),
                "FEEDBACK_SUBMITTED",
                "New feedback submitted",
                "A learner submitted feedback for event \"" + event.getTitle() + "\".",
                event.getId()
        );

        return ResponseEntity.ok(buildNextSuggestion(event, feedback));
    }

    @GetMapping("/{id}/feedback/suggestion")
    public ResponseEntity<?> feedbackSuggestion(@PathVariable Long id) {
        JwtAuthenticationFilter.JwtUserDetails user = getCurrentUser();
        if (user == null || !"LEARNER".equalsIgnoreCase(user.role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        Event event = eventRepository.findById(id).orElse(null);
        if (event == null) return ResponseEntity.notFound().build();

        var feedbackOpt = feedbackRepository.findByEventIdAndLearnerId(id, user.userId);
        if (feedbackOpt.isEmpty()) {
            return ResponseEntity.ok(java.util.Map.of("message", "No feedback yet"));
        }
        return ResponseEntity.ok(buildNextSuggestion(event, feedbackOpt.get()));
    }

    private java.util.Map<String, Object> buildNextSuggestion(Event currentEvent, EventFeedback feedback) {
        Event.LearningLevel targetLevel = switch (feedback.getDifficulty()) {
            case EASY -> escalateLevel(currentEvent.getLearningLevel());
            case MEDIUM -> Event.LearningLevel.ADVANCED;
            case HARD -> Event.LearningLevel.INTERMEDIATE;
        };

        String currentCategory = currentEvent.getCategory() == null ? "" : currentEvent.getCategory().toLowerCase();
        java.util.Set<String> currentSkills = currentEvent.getRequiredSkills() == null
                ? java.util.Set.of()
                : currentEvent.getRequiredSkills().stream().map(String::toLowerCase).collect(java.util.stream.Collectors.toSet());
        java.util.Set<String> preferredWords = feedback.getWhatNext() == null
                ? java.util.Set.of()
                : java.util.Arrays.stream(feedback.getWhatNext().toLowerCase().split("\\W+"))
                    .filter(s -> s.length() > 2).collect(java.util.stream.Collectors.toSet());

        java.time.Instant now = java.time.Instant.now();
        java.util.List<Event> candidates = eventRepository.findByStatusAndDateStartAfterOrderByDateStartAsc(Event.EventStatus.UPCOMING, now).stream()
                .filter(e -> !e.getId().equals(currentEvent.getId()))
                .toList();

        // Pass 1: strict target level + same category
        Event suggestion = candidates.stream()
                .filter(e -> e.getLearningLevel() == targetLevel)
                .filter(e -> currentCategory.isBlank() || (e.getCategory() != null && e.getCategory().toLowerCase().contains(currentCategory)))
                .max(java.util.Comparator.comparingInt(e -> scoreCandidate(e, currentSkills, preferredWords)))
                .orElse(null);

        // Pass 2: target level, any category
        if (suggestion == null) {
            suggestion = candidates.stream()
                    .filter(e -> e.getLearningLevel() == targetLevel)
                    .max(java.util.Comparator.comparingInt(e -> scoreCandidate(e, currentSkills, preferredWords)))
                    .orElse(null);
        }

        // Pass 3: closest level fallback (never return empty if upcoming events exist)
        if (suggestion == null && !candidates.isEmpty()) {
            suggestion = candidates.stream()
                    .min(java.util.Comparator.<Event>comparingInt(e -> levelDistance(e.getLearningLevel(), targetLevel))
                            .thenComparingInt(e -> -scoreCandidate(e, currentSkills, preferredWords)))
                    .orElse(null);
        }

        java.util.Map<String, Object> res = new java.util.HashMap<>();
        res.put("targetLevel", targetLevel.name());
        res.put("message", switch (feedback.getDifficulty()) {
            case EASY -> "You said this event was easy. We suggest a harder next step.";
            case MEDIUM -> "You said medium difficulty. We suggest an advanced follow-up.";
            case HARD -> "You said hard. We suggest an intermediate consolidation event.";
        });
        res.put("suggestedEvent", suggestion);
        return res;
    }

    private int scoreCandidate(Event event, java.util.Set<String> currentSkills, java.util.Set<String> preferredWords) {
        int score = 0;
        if (event.getRequiredSkills() != null) {
            for (String s : event.getRequiredSkills()) {
                if (s == null) continue;
                String k = s.toLowerCase();
                if (currentSkills.contains(k)) score += 3;
                if (preferredWords.contains(k)) score += 5;
            }
        }
        if (event.getCategory() != null) {
            String c = event.getCategory().toLowerCase();
            for (String w : preferredWords) {
                if (c.contains(w)) score += 4;
            }
        }
        return score;
    }

    private Event.LearningLevel escalateLevel(Event.LearningLevel current) {
        if (current == Event.LearningLevel.BEGINNER) return Event.LearningLevel.INTERMEDIATE;
        return Event.LearningLevel.ADVANCED;
    }

    private int levelDistance(Event.LearningLevel a, Event.LearningLevel b) {
        return Math.abs(levelRank(a) - levelRank(b));
    }

    private int levelRank(Event.LearningLevel level) {
        return switch (level) {
            case BEGINNER -> 0;
            case INTERMEDIATE -> 1;
            case ADVANCED -> 2;
        };
    }

    // ---- TRAINER ----
    @PostMapping
    public ResponseEntity<?> createEvent(@Valid @RequestBody CreateEventRequest request) {
        JwtAuthenticationFilter.JwtUserDetails user = getCurrentUser();
        if (user == null || !"TRAINER".equals(user.role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(java.util.Map.of("message", "Only trainers can create events"));
        }

        try {
            Event created = eventService.createEvent(request, user.userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<List<Event>> myEvents() {
        JwtAuthenticationFilter.JwtUserDetails user = getCurrentUser();
        if (user == null || !"TRAINER".equals(user.role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        List<Event> events = eventRepository.findByTrainerIdOrderByDateStartDesc(user.userId);
        attachParticipantCounts(events);
        return ResponseEntity.ok(events);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(@PathVariable Long id, @Valid @RequestBody CreateEventRequest request) {
        JwtAuthenticationFilter.JwtUserDetails user = getCurrentUser();
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        try {
            Event updated = eventService.updateEvent(id, request, isAdmin(), user.userId);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) return ResponseEntity.notFound().build();
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelEvent(@PathVariable Long id) {
        Event event = eventRepository.findById(id).orElse(null);
        if (event == null) return ResponseEntity.notFound().build();
        if (!canModify(event)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not allowed");

        event.setStatus(Event.EventStatus.CANCELLED);
        event.setUpdatedAt(Instant.now());
        eventRepository.save(event);

        List<EventRegistration> regs = registrationRepository.findByEvent(event);
        List<Long> learnerIds = new java.util.ArrayList<>();
        for (EventRegistration r : regs) {
            if (r.getStatus() != EventRegistration.RegistrationStatus.CANCELLED && 
                r.getStatus() != EventRegistration.RegistrationStatus.REJECTED) {
                r.setStatus(EventRegistration.RegistrationStatus.CANCELLED);
                registrationRepository.save(r);
                learnerIds.add(r.getLearnerId());
            }
        }

        if (!learnerIds.isEmpty()) {
            try {
                java.util.Map<String, Object> payload = new java.util.HashMap<>();
                payload.put("learnerIds", learnerIds);
                payload.put("eventTitle", event.getTitle());

                org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
                
                org.springframework.web.context.request.ServletRequestAttributes attrs = 
                    (org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
                if (attrs != null) {
                    String token = attrs.getRequest().getHeader("Authorization");
                    if (token != null) {
                        headers.set("Authorization", token);
                        System.out.println(">>> [DEBUG] Forwarding Authorization header to user-service.");
                    }
                }

                org.springframework.http.HttpEntity<java.util.Map<String, Object>> requestEntity = new org.springframework.http.HttpEntity<>(payload, headers);

                String resp = restTemplate.postForObject("http://USER-SERVICE/api/users/internal/notifications/event-cancelled", requestEntity, String.class);
                System.out.println(">>> [INFO] Notified user-service about event cancellation. Response: " + resp);
            } catch (Exception e) {
                System.err.println(">>> [ERROR] Failed to notify users of event cancellation: " + e.getMessage());
            }
        }
        
        return ResponseEntity.ok(java.util.Map.of("message", "Event cancelled"));
    }

    @Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id) {
        JwtAuthenticationFilter.JwtUserDetails user = getCurrentUser();
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        try {
            eventService.deleteEvent(id, isAdmin(), user.userId);
            return ResponseEntity.ok(java.util.Map.of("message", "Event deleted"));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) return ResponseEntity.notFound().build();
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }



    // ---- LEARNER ----
    @PostMapping("/{id}/register")
    public ResponseEntity<?> register(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        try {
            JwtAuthenticationFilter.JwtUserDetails user = getCurrentUser();
            
            if (user == null || !"LEARNER".equalsIgnoreCase(user.role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(java.util.Map.of("message", "Seuls les apprenants peuvent s'inscrire"));
            }

            String firstName = body != null ? body.get("firstName") : null;
            String lastName = body != null ? body.get("lastName") : null;

            EventRegistration reg = eventService.register(id, user.userId, firstName, lastName);
            
            String message = reg.getStatus() == EventRegistration.RegistrationStatus.WAITLISTED 
                ? "Liste d'attente (Événement complet)" 
                : "Demande d'inscription envoyée. En attente d'approbation.";

            return ResponseEntity.status(HttpStatus.CREATED).body(java.util.Map.of("message", message, "status", reg.getStatus()));
        } catch (RuntimeException e) {
            System.err.println(">>> [ERROR] Registration failed: " + e.getMessage());
            if (e.getMessage().contains("not found")) return ResponseEntity.notFound().build();
            if (e.getMessage().contains("Already registered")) return ResponseEntity.status(HttpStatus.CONFLICT).body(java.util.Map.of("message", e.getMessage()));
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        } catch (Exception e) {
            System.err.println(">>> [ERROR] Unexpected error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("message", "Erreur interne: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/register")
    public ResponseEntity<?> unregister(@PathVariable Long id) {
        JwtAuthenticationFilter.JwtUserDetails user = getCurrentUser();
        if (user == null || !"LEARNER".equalsIgnoreCase(user.role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Event event = eventRepository.findById(id).orElse(null);
        if (event == null) return ResponseEntity.notFound().build();

        var regOpt = registrationRepository.findByEventAndLearnerId(event, user.userId);
        if (regOpt.isEmpty()) return ResponseEntity.notFound().build();

        EventRegistration reg = regOpt.get();
        EventRegistration.RegistrationStatus oldStatus = reg.getStatus();
        reg.setStatus(EventRegistration.RegistrationStatus.CANCELLED);
        registrationRepository.save(reg);
        interactionService.track(user.userId, event, EventInteraction.InteractionType.CANCEL);
        grantXp(user.userId, "CANCEL_EVENT", event.getId());

        // If the cancelled person was approved or pending, and there's a waitlist, promote the first one to PENDING
        if (oldStatus == EventRegistration.RegistrationStatus.APPROVED || oldStatus == EventRegistration.RegistrationStatus.PENDING) {
            registrationRepository.findFirstByEventAndStatusOrderByRegisteredAtAsc(event, EventRegistration.RegistrationStatus.WAITLISTED)
                .ifPresent(next -> {
                    next.setStatus(EventRegistration.RegistrationStatus.PENDING);
                    registrationRepository.save(next);
                    dispatchNotification(
                            List.of(next.getLearnerId()),
                            "WAITLIST_PROMOTED",
                            "You moved from waitlist",
                            "You moved from waitlist to pending approval for \"" + event.getTitle() + "\".",
                            event.getId()
                    );
                });
        }

        return ResponseEntity.ok(java.util.Map.of("message", "Unregistered"));
    }

    @GetMapping("/my-registrations")
    public ResponseEntity<List<RegistrationDto>> myRegistrations() {
        JwtAuthenticationFilter.JwtUserDetails user = getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        System.out.println(">>> [DEBUG] myRegistrations for user " + user.userId);
        
        List<EventRegistration> regs = registrationRepository.findByLearnerIdAndStatusIn(
                user.userId, 
                List.of(EventRegistration.RegistrationStatus.APPROVED, 
                        EventRegistration.RegistrationStatus.PENDING,
                        EventRegistration.RegistrationStatus.WAITLISTED, 
                        EventRegistration.RegistrationStatus.ATTENDED)
        );
        
        System.out.println(">>> [DEBUG] Found " + regs.size() + " registrations for user " + user.userId);

        List<RegistrationDto> list = regs.stream()
                .map(r -> new RegistrationDto(r.getEvent(), r.getStatus().name()))
                .collect(java.util.stream.Collectors.toList());
                
        return ResponseEntity.ok(list);
    }

    public record RegistrationDto(Event event, String status) {}
    public record InteractionRequest(Long eventId, String type) {}
    public record FeedbackRequest(String difficulty, Boolean understood, Integer rating, String whatNext) {}



}
