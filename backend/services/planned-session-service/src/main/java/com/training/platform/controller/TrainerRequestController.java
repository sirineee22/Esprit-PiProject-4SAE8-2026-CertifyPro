package com.training.platform.controller;

import com.training.platform.client.UserServiceClient;
import com.training.platform.entity.TrainerRequest;
import com.training.platform.repository.TrainerRequestRepository;
import jakarta.validation.Valid;
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
    private UserServiceClient userServiceClient;



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

        try {
            String role = userServiceClient.getUserRole(dto.userId);
            if (!"LEARNER".equals(role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Only learners can request trainer status");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("User not found or error fetching user role");
        }

        // Check for pending request
        if (trainerRequestRepository.existsByUserIdAndStatus(dto.userId, TrainerRequest.RequestStatus.PENDING)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("You already have a pending trainer request");
        }

        // Check cooldown after rejection
        Optional<TrainerRequest> lastRejected = trainerRequestRepository
                .findFirstByUserIdAndStatusOrderByCreatedAtDesc(dto.userId, TrainerRequest.RequestStatus.REJECTED);

        if (lastRejected.isPresent() && lastRejected.get().getRejectedAt() != null) {
            long daysSinceRejection = ChronoUnit.DAYS.between(
                    lastRejected.get().getRejectedAt(),
                    LocalDateTime.now());
            if (daysSinceRejection < COOLDOWN_DAYS) {
                long daysRemaining = COOLDOWN_DAYS - daysSinceRejection;
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .body("You can resubmit in " + daysRemaining + " days");
            }
        }

        // Create request
        TrainerRequest request = new TrainerRequest();
        request.setUserId(dto.userId);
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
        return ResponseEntity.ok(trainerRequestRepository.findByUserIdOrderByCreatedAtDesc(userId));
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

        // Update user role to TRAINER and activate account via FeignClient
        try {
            userServiceClient.approveTrainerRole(request.getUserId());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating user role in user-service: " + e.getMessage());
        }

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
