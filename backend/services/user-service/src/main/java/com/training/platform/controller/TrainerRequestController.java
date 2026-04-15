package com.training.platform.controller;

import com.training.platform.entity.Role;
import com.training.platform.entity.TrainerRequest;
import com.training.platform.entity.User;
import com.training.platform.repository.RoleRepository;
import com.training.platform.repository.TrainerRequestRepository;
import com.training.platform.repository.UserRepository;
import com.training.platform.security.JwtAuthenticationFilter;
import com.training.platform.service.EmailService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/trainer-requests")
public class TrainerRequestController {

    @Autowired
    private TrainerRequestRepository trainerRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private EmailService emailService;

    private static final int COOLDOWN_DAYS = 7;

    private JwtAuthenticationFilter.JwtUserDetails getCurrentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getDetails() == null) return null;
        Object details = auth.getDetails();
        return details instanceof JwtAuthenticationFilter.JwtUserDetails u ? u : null;
    }

    @PostMapping
    public ResponseEntity<?> submitRequest(@Valid @RequestBody TrainerRequestDto dto) {
        JwtAuthenticationFilter.JwtUserDetails principal = getCurrentUser();
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication required");
        }
        if (!principal.userId.equals(dto.userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You can only submit a request for your own account");
        }

        User user = userRepository.findById(dto.userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user is LEARNER
        if (user.getRole() == null || !"LEARNER".equals(user.getRole().getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only learners can request trainer status");
        }

        // Check for pending request
        if (trainerRequestRepository.existsByUserAndStatus(user, TrainerRequest.RequestStatus.PENDING)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("You already have a pending trainer request");
        }

        // Check cooldown after rejection
        Optional<TrainerRequest> lastRejected = trainerRequestRepository
                .findFirstByUserAndStatusOrderByCreatedAtDesc(user, TrainerRequest.RequestStatus.REJECTED);
        
        if (lastRejected.isPresent() && lastRejected.get().getRejectedAt() != null) {
            long daysSinceRejection = ChronoUnit.DAYS.between(
                    lastRejected.get().getRejectedAt(), 
                    LocalDateTime.now()
            );
            if (daysSinceRejection < COOLDOWN_DAYS) {
                long daysRemaining = COOLDOWN_DAYS - daysSinceRejection;
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .body("You can resubmit in " + daysRemaining + " days");
            }
        }

        // Create request
        TrainerRequest request = new TrainerRequest();
        request.setUser(user);
        request.setSubjects(dto.subjects);
        request.setMessage(dto.message);
        request.setExperience(dto.experience);
        request.setCertificatesLink(dto.certificatesLink);
        request.setStatus(TrainerRequest.RequestStatus.PENDING);

        return ResponseEntity.ok(trainerRequestRepository.save(request));
    }

    @GetMapping("/my-requests")
    public ResponseEntity<?> getMyRequests(@RequestParam Long userId) {
        JwtAuthenticationFilter.JwtUserDetails principal = getCurrentUser();
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (!"ADMIN".equals(principal.role) && !principal.userId.equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only view your own requests");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(trainerRequestRepository.findByUserOrderByCreatedAtDesc(user));
    }

    @GetMapping
    public ResponseEntity<List<TrainerRequest>> getAllPendingRequests() {
        return ResponseEntity.ok(trainerRequestRepository.findByStatus(TrainerRequest.RequestStatus.PENDING));
    }

    @PutMapping("/{id}/approve")
    @Transactional
    public ResponseEntity<?> approveRequest(@PathVariable Long id) {
        TrainerRequest request = trainerRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (request.getStatus() != TrainerRequest.RequestStatus.PENDING) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Request is not pending");
        }

        // Update request status
        request.setStatus(TrainerRequest.RequestStatus.APPROVED);
        request.setUpdatedAt(LocalDateTime.now());
        trainerRequestRepository.save(request);

        // Update user role to TRAINER and activate account
        User user = request.getUser();
        Role trainerRole = roleRepository.findByName("TRAINER")
                .orElseThrow(() -> new RuntimeException("TRAINER role not found"));
        user.setRole(trainerRole);
        user.setActive(true);
        userRepository.save(user);

        emailService.sendTrainerApprovalEmail(user.getEmail(), user.getFirstName());

        return ResponseEntity.ok("Request approved successfully");
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectRequest(@PathVariable Long id) {
        TrainerRequest request = trainerRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (request.getStatus() != TrainerRequest.RequestStatus.PENDING) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Request is not pending");
        }

        request.setStatus(TrainerRequest.RequestStatus.REJECTED);
        request.setUpdatedAt(LocalDateTime.now());
        request.setRejectedAt(LocalDateTime.now());
        trainerRequestRepository.save(request);

        emailService.sendTrainerRejectionEmail(request.getUser().getEmail(), request.getUser().getFirstName());

        return ResponseEntity.ok("Request rejected");
    }

    // DTOs
    static class TrainerRequestDto {
        @NotNull
        public Long userId;

        @NotBlank
        public String subjects;

        @NotBlank
        public String message;

        public String experience;

        public String certificatesLink;
    }
}
