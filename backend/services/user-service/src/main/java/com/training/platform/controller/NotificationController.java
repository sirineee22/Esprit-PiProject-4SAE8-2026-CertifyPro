package com.training.platform.controller;

import com.training.platform.entity.Notification;
import com.training.platform.entity.User;
import com.training.platform.repository.NotificationRepository;
import com.training.platform.repository.UserRepository;
import com.training.platform.security.JwtAuthenticationFilter;
import com.training.platform.service.EmailService;
import com.training.platform.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class NotificationController {
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;

    public NotificationController(
            UserRepository userRepository,
            EmailService emailService,
            NotificationService notificationService,
            NotificationRepository notificationRepository
    ) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.notificationService = notificationService;
        this.notificationRepository = notificationRepository;
    }

    public static class EventCancelRequest {
        private List<Long> learnerIds;
        private String eventTitle;

        public List<Long> getLearnerIds() {
            return learnerIds;
        }

        public void setLearnerIds(List<Long> learnerIds) {
            this.learnerIds = learnerIds;
        }

        public String getEventTitle() {
            return eventTitle;
        }

        public void setEventTitle(String eventTitle) {
            this.eventTitle = eventTitle;
        }
    }

    @PostMapping("/api/users/internal/notifications/event-cancelled")
    public ResponseEntity<?> notifyEventCancelled(@RequestBody EventCancelRequest request) {
        if (request.getLearnerIds() == null || request.getLearnerIds().isEmpty()) {
            return ResponseEntity.ok().build();
        }

        List<User> users = userRepository.findAllById(request.getLearnerIds());
        for (User user : users) {
             emailService.sendEventCancellationEmail(user.getEmail(), user.getFirstName(), request.getEventTitle());
        }

        return ResponseEntity.ok().build();
    }

    public static class DispatchRequest {
        private List<Long> recipientIds;
        private String type;
        private String title;
        private String message;
        private Long eventId;

        public List<Long> getRecipientIds() { return recipientIds; }
        public void setRecipientIds(List<Long> recipientIds) { this.recipientIds = recipientIds; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public Long getEventId() { return eventId; }
        public void setEventId(Long eventId) { this.eventId = eventId; }
    }

    @PostMapping("/api/users/internal/notifications/dispatch")
    public ResponseEntity<?> dispatch(@RequestBody DispatchRequest request) {
        if (request == null || request.getRecipientIds() == null || request.getRecipientIds().isEmpty()
                || request.getTitle() == null || request.getTitle().isBlank()
                || request.getMessage() == null || request.getMessage().isBlank()) {
            return ResponseEntity.badRequest().body("Invalid notification payload");
        }
        notificationService.dispatchToUsers(
                request.getRecipientIds(),
                request.getType() == null ? "GENERIC" : request.getType(),
                request.getTitle(),
                request.getMessage(),
                request.getEventId()
        );
        return ResponseEntity.ok().build();
    }

    private JwtAuthenticationFilter.JwtUserDetails getCurrentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getDetails() == null) return null;
        Object details = auth.getDetails();
        return details instanceof JwtAuthenticationFilter.JwtUserDetails
                ? (JwtAuthenticationFilter.JwtUserDetails) details
                : null;
    }

    @GetMapping("/api/users/notifications/my")
    public ResponseEntity<List<Notification>> myNotifications() {
        JwtAuthenticationFilter.JwtUserDetails user = getCurrentUser();
        if (user == null || user.userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(notificationRepository.findByUserIdOrderByCreatedAtDesc(user.userId));
    }

    @PutMapping("/api/users/notifications/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id) {
        JwtAuthenticationFilter.JwtUserDetails user = getCurrentUser();
        if (user == null || user.userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        var notification = notificationRepository.findByIdAndUserId(id, user.userId).orElse(null);
        if (notification == null) return ResponseEntity.notFound().build();
        notification.setRead(true);
        notificationRepository.save(notification);
        return ResponseEntity.ok().build();
    }
}
