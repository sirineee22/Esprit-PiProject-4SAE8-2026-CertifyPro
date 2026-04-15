package com.training.events.service;

import com.training.events.dto.CreateEventRequest;
import com.training.events.entity.Event;
import com.training.events.entity.EventFeedback;
import com.training.events.entity.EventInteraction;
import com.training.events.entity.EventRegistration;
import com.training.events.entity.ProgramItem;
import com.training.events.repository.EventFeedbackRepository;
import com.training.events.repository.EventInteractionRepository;
import com.training.events.repository.EventRegistrationRepository;
import com.training.events.repository.EventRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final EventRegistrationRepository registrationRepository;
    private final EventInteractionRepository interactionRepository;
    private final EventFeedbackRepository feedbackRepository;
    private final EventInteractionService interactionService;
    private final RestTemplate restTemplate;

    public EventService(
            EventRepository eventRepository,
            EventRegistrationRepository registrationRepository,
            EventInteractionRepository interactionRepository,
            EventFeedbackRepository feedbackRepository,
            EventInteractionService interactionService,
            RestTemplate restTemplate
    ) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.interactionRepository = interactionRepository;
        this.feedbackRepository = feedbackRepository;
        this.interactionService = interactionService;
        this.restTemplate = restTemplate;
    }

    public Page<Event> listEvents(Event.EventType type, Event.EventMode mode, Boolean upcomingOnly, PageRequest pageRequest) {
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
        attachParticipantCounts(events.getContent());
        return events;
    }

    public Optional<Event> getEvent(Long id) {
        return eventRepository.findById(id).map(e -> {
            attachParticipantCount(e);
            return e;
        });
    }

    @Transactional
    public Event createEvent(CreateEventRequest request, Long trainerId) {
        validateEventRequest(request);

        Event event = new Event();
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setTrainerId(trainerId);
        event.setTrainerFirstName(request.getTrainerFirstName());
        event.setTrainerLastName(request.getTrainerLastName());
        event.setType(request.getType());
        event.setMode(request.getMode());
        event.setLearningLevel(request.getLearningLevel());
        event.setCategory(request.getCategory());
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
        if (request.getRequiredSkills() != null) {
            event.setRequiredSkills(request.getRequiredSkills().stream()
                    .filter(s -> s != null && !s.isBlank())
                    .map(String::trim)
                    .collect(Collectors.toList()));
        }
        
        Event saved = eventRepository.save(event);
        grantXp(trainerId, "CREATE_EVENT", saved.getId());
        return saved;
    }

    @Transactional
    public Event updateEvent(Long id, CreateEventRequest request, boolean isAdmin, Long currentUserId) {
        Event event = eventRepository.findById(id).orElseThrow(() -> new RuntimeException("Event not found"));
        if (!isAdmin && !event.getTrainerId().equals(currentUserId)) {
            throw new RuntimeException("Not allowed to update this event");
        }

        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setType(request.getType());
        event.setMode(request.getMode());
        event.setLearningLevel(request.getLearningLevel());
        event.setCategory(request.getCategory());
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
        event.setRequiredSkills(request.getRequiredSkills() != null
                ? request.getRequiredSkills().stream().filter(s -> s != null && !s.isBlank()).map(String::trim).collect(Collectors.toList())
                : List.of());
        
        Event updated = eventRepository.save(event);

        List<Long> learnerIds = registrationRepository.findByEventAndStatus(updated, EventRegistration.RegistrationStatus.APPROVED)
                .stream().map(EventRegistration::getLearnerId).toList();
        dispatchNotification(
                learnerIds,
                "EVENT_UPDATED",
                "Event updated",
                "The event \"" + updated.getTitle() + "\" has been updated. Please check new details.",
                updated.getId()
        );

        return updated;
    }

    @Transactional
    public void deleteEvent(Long id, boolean isAdmin, Long currentUserId) {
        Event event = eventRepository.findById(id).orElseThrow(() -> new RuntimeException("Event not found"));
        if (!isAdmin && !event.getTrainerId().equals(currentUserId)) {
            throw new RuntimeException("Not allowed to delete this event");
        }

        registrationRepository.deleteByEventId(id);
        interactionRepository.deleteByEventId(id);
        feedbackRepository.deleteByEventId(id);
        eventRepository.delete(event);
    }

    @Transactional
    public EventRegistration register(Long eventId, Long userId, String firstName, String lastName) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new RuntimeException("Event not found"));
        
        if (event.getStatus() != Event.EventStatus.UPCOMING) {
            throw new RuntimeException("Event is not open for registration");
        }
        if (event.getDateEnd() != null && event.getDateEnd().isBefore(Instant.now())) {
            throw new RuntimeException("Event is already finished");
        }

        var optReg = registrationRepository.findByEventAndLearnerId(event, userId);
        if (optReg.isPresent()) {
            EventRegistration.RegistrationStatus status = optReg.get().getStatus();
            if (status == EventRegistration.RegistrationStatus.APPROVED || status == EventRegistration.RegistrationStatus.PENDING) {
                throw new RuntimeException("Already registered or pending");
            }
        }

        long activeCount = registrationRepository.findByEventAndStatus(event, EventRegistration.RegistrationStatus.APPROVED).size()
                         + registrationRepository.findByEventAndStatus(event, EventRegistration.RegistrationStatus.PENDING).size();
        
        EventRegistration.RegistrationStatus finalStatus = EventRegistration.RegistrationStatus.PENDING;
        if (activeCount >= event.getMaxParticipants()) {
            finalStatus = EventRegistration.RegistrationStatus.WAITLISTED;
        }

        EventRegistration reg = optReg.orElse(new EventRegistration());
        reg.setEvent(event);
        reg.setLearnerId(userId);
        reg.setLearnerFirstName(firstName != null ? firstName : "Learner");
        reg.setLearnerLastName(lastName != null ? lastName : "#" + userId);
        reg.setStatus(finalStatus);
        if (reg.getId() == null) {
            reg.setRegisteredAt(Instant.now());
        }
        
        EventRegistration saved = registrationRepository.save(reg);
        interactionService.track(userId, event, EventInteraction.InteractionType.REGISTER);

        dispatchNotification(
                List.of(event.getTrainerId()),
                "REGISTRATION_CREATED",
                "New event registration",
                "A learner requested registration for \"" + event.getTitle() + "\" (status: " + finalStatus + ").",
                event.getId()
        );

        return saved;
    }

    private void validateEventRequest(CreateEventRequest request) {
        Instant minStart = Instant.now().plusSeconds(180);
        if (request.getDateStart().isBefore(minStart)) {
            throw new RuntimeException("dateStart must be at least 3 minutes after current time");
        }
        if (!request.getDateEnd().isAfter(request.getDateStart())) {
            throw new RuntimeException("dateEnd must be after dateStart");
        }
        if (request.getMaxParticipants() == null || request.getMaxParticipants() <= 0) {
            throw new RuntimeException("maxParticipants must be > 0");
        }
        if (request.getMode() == Event.EventMode.ONLINE && (request.getMeetingLink() == null || request.getMeetingLink().isBlank())) {
            throw new RuntimeException("meetingLink required for ONLINE events");
        }
        if (request.getMode() == Event.EventMode.ONSITE && (request.getLocation() == null || request.getLocation().isBlank())) {
            throw new RuntimeException("location required for ONSITE events");
        }
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
}
