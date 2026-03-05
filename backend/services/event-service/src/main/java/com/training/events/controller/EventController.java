package com.training.events.controller;

import com.training.events.entity.Event;
import com.training.events.entity.EventRegistration;
import com.training.events.entity.ProgramItem;
import com.training.events.repository.EventRegistrationRepository;
import com.training.events.repository.ReviewRepository;
import com.training.events.repository.EventRepository;
import com.training.events.security.JwtAuthenticationFilter;
import com.training.events.dto.CreateEventRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventRepository eventRepository;
    private final EventRegistrationRepository registrationRepository;
    private final ReviewRepository reviewRepository;

    public EventController(EventRepository eventRepository, EventRegistrationRepository registrationRepository, ReviewRepository reviewRepository) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.reviewRepository = reviewRepository;
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

    // ---- REVIEWS ----
    @GetMapping("/{id}/reviews")
    public ResponseEntity<List<com.training.events.entity.Review>> getReviews(@PathVariable Long id) {
        return ResponseEntity.ok(reviewRepository.findByEventIdOrderByCreatedAtDesc(id));
    }

    @PostMapping("/{id}/reviews")
    public ResponseEntity<?> postReview(@PathVariable Long id, @RequestBody com.training.events.entity.Review reviewRequest) {
        JwtAuthenticationFilter.JwtUserDetails user = getCurrentUser();
        if (user == null || !"LEARNER".equals(user.role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(java.util.Map.of("message", "Only learners can post reviews"));
        }

        Event e = eventRepository.findById(id).orElse(null);
        if (e == null) return ResponseEntity.notFound().build();

        // Check if event is finished
        if (e.getDateEnd().isAfter(Instant.now())) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "You can only review finished events"));
        }

        // Check if learner is registered
        if (!registrationRepository.existsByEventIdAndLearnerId(id, user.userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(java.util.Map.of("message", "You must be registered to review this event"));
        }

        // Check if already reviewed
        if (reviewRepository.existsByEventIdAndLearnerId(id, user.userId)) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "You have already reviewed this event"));
        }

        com.training.events.entity.Review review = new com.training.events.entity.Review();
        review.setEvent(e);
        review.setLearnerId(user.userId);
        review.setLearnerFirstName(reviewRequest.getLearnerFirstName());
        review.setLearnerLastName(reviewRequest.getLearnerLastName());
        review.setRating(reviewRequest.getRating());
        review.setComment(reviewRequest.getComment());

        return ResponseEntity.ok(reviewRepository.save(review));
    }

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
        Page<Event> events;
        if (Boolean.TRUE.equals(upcomingOnly)) {
            events = eventRepository.findByStatusAndDateStartAfter(
                    Event.EventStatus.UPCOMING, Instant.now(), pageRequest);
        } else {
            events = eventRepository.findAll(pageRequest);
        }
        if (type != null || mode != null) {
            List<Event> list = events.getContent().stream()
                    .filter(e -> (type == null || e.getType() == type) && (mode == null || e.getMode() == mode))
                    .toList();
            events = new org.springframework.data.domain.PageImpl<>(list, pageRequest, list.size());
        }
        return ResponseEntity.ok(events);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Event> getEvent(@PathVariable Long id) {
        return eventRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ---- TRAINER ----
    @PostMapping
    public ResponseEntity<?> createEvent(@Valid @RequestBody CreateEventRequest request) {
        JwtAuthenticationFilter.JwtUserDetails user = getCurrentUser();
        if (user == null || !"TRAINER".equals(user.role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(java.util.Map.of("message", "Only trainers can create events"));
        }

        if (request.getDateStart().isBefore(Instant.now().minusSeconds(300))) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "dateStart must be in the future (at least >= current time - 5min)"));
        }
        if (!request.getDateEnd().isAfter(request.getDateStart())) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "dateEnd must be after dateStart"));
        }
        if (request.getMaxParticipants() == null || request.getMaxParticipants() <= 0) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "maxParticipants must be > 0"));
        }
        if (request.getMode() == Event.EventMode.ONLINE && (request.getMeetingLink() == null || request.getMeetingLink().isBlank())) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "meetingLink required for ONLINE events"));
        }
        if (request.getMode() == Event.EventMode.ONSITE && (request.getLocation() == null || request.getLocation().isBlank())) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "location required for ONSITE events"));
        }
        if (request.getMode() == Event.EventMode.HYBRID) {
            if (request.getMeetingLink() == null || request.getMeetingLink().isBlank())
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "meetingLink required for HYBRID"));
            if (request.getLocation() == null || request.getLocation().isBlank())
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "location required for HYBRID"));
        }

        Event event = new Event();
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setTrainerId(user.userId);
        event.setTrainerFirstName(request.getTrainerFirstName());
        event.setTrainerLastName(request.getTrainerLastName());
        event.setType(request.getType());
        event.setMode(request.getMode());
        event.setDateStart(request.getDateStart());
        event.setDateEnd(request.getDateEnd());
        event.setMeetingLink(request.getMeetingLink());
        event.setLocation(request.getLocation());
        event.setMaxParticipants(request.getMaxParticipants());
        event.setStatus(Event.EventStatus.UPCOMING);

        if (request.getProgram() != null) {
            event.setProgram(request.getProgram().stream()
                .map(p -> new ProgramItem(p.getTime(), p.getActivity()))
                .collect(Collectors.toList()));
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(eventRepository.save(event));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Event>> myEvents() {
        JwtAuthenticationFilter.JwtUserDetails user = getCurrentUser();
        if (user == null || !"TRAINER".equals(user.role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(eventRepository.findByTrainerIdOrderByDateStartDesc(user.userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(@PathVariable Long id, @Valid @RequestBody CreateEventRequest request) {
        Event event = eventRepository.findById(id).orElse(null);
        if (event == null) return ResponseEntity.notFound().build();
        if (!canModify(event)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not allowed");

        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setType(request.getType());
        event.setMode(request.getMode());
        event.setDateStart(request.getDateStart());
        event.setDateEnd(request.getDateEnd());
        event.setMeetingLink(request.getMeetingLink());
        event.setLocation(request.getLocation());
        event.setMaxParticipants(request.getMaxParticipants());
        event.setUpdatedAt(Instant.now());

        if (request.getProgram() != null) {
            event.getProgram().clear();
            event.getProgram().addAll(request.getProgram().stream()
                .map(p -> new ProgramItem(p.getTime(), p.getActivity()))
                .collect(Collectors.toList()));
        }

        return ResponseEntity.ok(eventRepository.save(event));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelEvent(@PathVariable Long id) {
        Event event = eventRepository.findById(id).orElse(null);
        if (event == null) return ResponseEntity.notFound().build();
        if (!canModify(event)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not allowed");

        event.setStatus(Event.EventStatus.CANCELLED);
        event.setUpdatedAt(Instant.now());
        eventRepository.save(event);

        List<EventRegistration> regs = registrationRepository.findByEventAndStatus(event, EventRegistration.RegistrationStatus.REGISTERED);
        for (EventRegistration r : regs) {
            r.setStatus(EventRegistration.RegistrationStatus.CANCELLED);
            registrationRepository.save(r);
        }
        return ResponseEntity.ok(java.util.Map.of("message", "Event cancelled"));
    }



    // ---- LEARNER ----
    @PostMapping("/{id}/register")
    public ResponseEntity<?> register(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        try {
            JwtAuthenticationFilter.JwtUserDetails user = getCurrentUser();
            
            if (user == null || !"LEARNER".equals(user.role)) {
                System.out.println(">>> [DEBUG] Registration attempt for event " + id + " failed: User not authenticated or not a learner.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(java.util.Map.of("message", "Seuls les apprenants peuvent s'inscrire"));
            }

            System.out.println(">>> [DEBUG] Registration attempt for event " + id + " by user " + user.userId);

            Event event = eventRepository.findById(id).orElse(null);
            if (event == null) {
                System.out.println(">>> [DEBUG] Event not found: " + id);
                return ResponseEntity.notFound().build();
            }
            
            if (event.getStatus() != Event.EventStatus.UPCOMING) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "L'événement n'est plus ouvert aux inscriptions"));
            }
            // Safe null check for dateEnd
            if (event.getDateEnd() != null && event.getDateEnd().isBefore(Instant.now())) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "L'événement est déjà terminé"));
            }

            var optReg = registrationRepository.findByEventAndLearnerId(event, user.userId);
            if (optReg.isPresent()) {
                EventRegistration existing = optReg.get();
                if (existing.getStatus() == EventRegistration.RegistrationStatus.REGISTERED) {
                    return ResponseEntity.status(HttpStatus.CONFLICT).body(java.util.Map.of("message", "Vous êtes déjà inscrit"));
                }
                if (existing.getStatus() == EventRegistration.RegistrationStatus.WAITLISTED) {
                    return ResponseEntity.status(HttpStatus.CONFLICT).body(java.util.Map.of("message", "Vous êtes déjà en liste d'attente"));
                }
            }

            long count = registrationRepository.findByEventAndStatus(event, EventRegistration.RegistrationStatus.REGISTERED).size();
            EventRegistration.RegistrationStatus finalStatus = EventRegistration.RegistrationStatus.REGISTERED;
            String message = "Registered";

            if (count >= event.getMaxParticipants()) {
                finalStatus = EventRegistration.RegistrationStatus.WAITLISTED;
                message = "Waitlisted";
            }

            String firstName = body != null ? body.get("firstName") : null;
            String lastName = body != null ? body.get("lastName") : null;

            EventRegistration reg = optReg.orElse(new EventRegistration());
            reg.setEvent(event);
            reg.setLearnerId(user.userId);
            reg.setLearnerFirstName(firstName != null ? firstName : "Learner");
            reg.setLearnerLastName(lastName != null ? lastName : "#" + user.userId);
            reg.setStatus(finalStatus);
            if (reg.getId() == null) {
                reg.setRegisteredAt(Instant.now());
            }
            
            System.out.println(">>> [DEBUG] Saving registration with status: " + finalStatus);
            registrationRepository.save(reg);
            System.out.println(">>> [DEBUG] Registration saved successfully");
            
            return ResponseEntity.status(HttpStatus.CREATED).body(java.util.Map.of("message", message, "status", finalStatus));
        } catch (Exception e) {
            System.err.println(">>> [ERROR] Registration failed for event " + id);
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("message", "Erreur interne: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/register")
    public ResponseEntity<?> unregister(@PathVariable Long id) {
        JwtAuthenticationFilter.JwtUserDetails user = getCurrentUser();
        if (user == null || !"LEARNER".equals(user.role)) {
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

        // If the cancelled person was actually registered, and there's a waitlist, promote the first one
        if (oldStatus == EventRegistration.RegistrationStatus.REGISTERED) {
            registrationRepository.findFirstByEventAndStatusOrderByRegisteredAtAsc(event, EventRegistration.RegistrationStatus.WAITLISTED)
                .ifPresent(next -> {
                    next.setStatus(EventRegistration.RegistrationStatus.REGISTERED);
                    registrationRepository.save(next);
                });
        }

        return ResponseEntity.ok(java.util.Map.of("message", "Unregistered"));
    }

    @GetMapping("/my-registrations")
    public ResponseEntity<List<RegistrationDto>> myRegistrations() {
        JwtAuthenticationFilter.JwtUserDetails user = getCurrentUser();
        if (user == null || !"LEARNER".equals(user.role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        System.out.println(">>> [DEBUG] myRegistrations for user " + user.userId);
        
        List<EventRegistration> regs = registrationRepository.findByLearnerIdAndStatusIn(
                user.userId, 
                List.of(EventRegistration.RegistrationStatus.REGISTERED, 
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



}
