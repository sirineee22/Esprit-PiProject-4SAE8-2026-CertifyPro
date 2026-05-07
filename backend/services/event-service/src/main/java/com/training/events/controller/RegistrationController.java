package com.training.events.controller;

import com.training.events.entity.Event;
import com.training.events.entity.EventRegistration;
import com.training.events.repository.EventRegistrationRepository;
import com.training.events.repository.EventRepository;
import com.training.events.security.JwtAuthenticationFilter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events/management")
public class RegistrationController {

    private final EventRepository eventRepository;
    private final EventRegistrationRepository registrationRepository;
    private final RestTemplate restTemplate;

    public RegistrationController(EventRepository eventRepository, EventRegistrationRepository registrationRepository, RestTemplate restTemplate) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.restTemplate = restTemplate;
    }

    private JwtAuthenticationFilter.JwtUserDetails getCurrentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getDetails() == null) return null;
        Object details = auth.getDetails();
        return details instanceof JwtAuthenticationFilter.JwtUserDetails
                ? (JwtAuthenticationFilter.JwtUserDetails) details
                : null;
    }

    private boolean canManageEvent(Event event) {
        JwtAuthenticationFilter.JwtUserDetails u = getCurrentUser();
        if (u == null) return false;
        return "ADMIN".equals(u.role) || event.getTrainerId().equals(u.userId);
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

    @GetMapping("/{eventId}/registrations")
    public ResponseEntity<List<EventRegistration>> getEventRegistrations(@PathVariable Long eventId) {
        Event event = eventRepository.findById(eventId).orElse(null);
        if (event == null) return ResponseEntity.notFound().build();
        if (!canManageEvent(event)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        
        return ResponseEntity.ok(registrationRepository.findByEvent(event));
    }

    @PutMapping("/registrations/{regId}/approve")
    public ResponseEntity<?> approve(@PathVariable Long regId) {
        EventRegistration reg = registrationRepository.findById(regId).orElse(null);
        if (reg == null) return ResponseEntity.notFound().build();
        if (!canManageEvent(reg.getEvent())) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        reg.setStatus(EventRegistration.RegistrationStatus.APPROVED);
        registrationRepository.save(reg);
        grantXp(reg.getLearnerId(), "COMPLETE_LEARNING_STEP", reg.getEvent().getId());
        dispatchNotification(
                List.of(reg.getLearnerId()),
                "REGISTRATION_APPROVED",
                "Registration approved",
                "Good news! Your registration for \"" + reg.getEvent().getTitle() + "\" has been approved.",
                reg.getEvent().getId()
        );
        return ResponseEntity.ok().build();
    }

    @Transactional
    @PutMapping("/registrations/{regId}/reject")
    public ResponseEntity<?> reject(@PathVariable Long regId) {
        EventRegistration reg = registrationRepository.findById(regId).orElse(null);
        if (reg == null) return ResponseEntity.notFound().build();
        if (!canManageEvent(reg.getEvent())) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        EventRegistration.RegistrationStatus previousStatus = reg.getStatus();
        reg.setStatus(EventRegistration.RegistrationStatus.REJECTED);
        registrationRepository.save(reg);

        // If an active seat is freed, promote the oldest waitlisted learner to PENDING.
        if (previousStatus == EventRegistration.RegistrationStatus.APPROVED
                || previousStatus == EventRegistration.RegistrationStatus.PENDING
                || previousStatus == EventRegistration.RegistrationStatus.ATTENDED) {
            registrationRepository.findFirstByEventAndStatusOrderByRegisteredAtAsc(
                    reg.getEvent(),
                    EventRegistration.RegistrationStatus.WAITLISTED
            ).ifPresent(next -> {
                next.setStatus(EventRegistration.RegistrationStatus.PENDING);
                registrationRepository.save(next);
                dispatchNotification(
                        List.of(next.getLearnerId()),
                        "WAITLIST_PROMOTED",
                        "You moved from waitlist",
                        "You moved from waitlist to pending approval for \"" + next.getEvent().getTitle() + "\".",
                        next.getEvent().getId()
                );
            });
        }

        return ResponseEntity.ok().build();
    }

    @PutMapping("/registrations/{regId}/attend")
    public ResponseEntity<?> markAttended(@PathVariable Long regId) {
        EventRegistration reg = registrationRepository.findById(regId).orElse(null);
        if (reg == null) return ResponseEntity.notFound().build();
        if (!canManageEvent(reg.getEvent())) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        reg.setStatus(EventRegistration.RegistrationStatus.ATTENDED);
        registrationRepository.save(reg);
        grantXp(reg.getLearnerId(), "ATTEND_EVENT", reg.getEvent().getId());
        return ResponseEntity.ok().build();
    }
}
