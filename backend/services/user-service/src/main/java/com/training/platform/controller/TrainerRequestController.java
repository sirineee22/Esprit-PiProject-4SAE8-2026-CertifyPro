package com.training.platform.controller;

import com.training.platform.entity.Role;
import com.training.platform.entity.TrainerRequest;
import com.training.platform.entity.User;
import com.training.platform.repository.RoleRepository;
import com.training.platform.repository.TrainerRequestRepository;
import com.training.platform.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    private static final int COOLDOWN_DAYS = 7;

    @PostMapping
    public ResponseEntity<?> submitRequest(@Valid @RequestBody TrainerRequestDto dto) {
        System.out.println("Received trainer request for userId: " + dto.userId);
        
        // Get user
        User user = userRepository.findById(dto.userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        System.out.println("User found: " + user.getEmail() + ", Role: " + 
            (user.getRole() != null ? user.getRole().getName() : "NULL"));

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
    public ResponseEntity<List<TrainerRequest>> getMyRequests(@RequestParam Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(trainerRequestRepository.findByUserOrderByCreatedAtDesc(user));
    }

    @GetMapping
    public ResponseEntity<List<TrainerRequest>> getAllPendingRequests() {
        // TODO: Add admin role check
        return ResponseEntity.ok(trainerRequestRepository.findByStatus(TrainerRequest.RequestStatus.PENDING));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveRequest(@PathVariable Long id) {
        // TODO: Add admin role check
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

        // Update user role to TRAINER
        User user = request.getUser();
        Role trainerRole = roleRepository.findByName("TRAINER")
                .orElseThrow(() -> new RuntimeException("TRAINER role not found"));
        user.setRole(trainerRole);
        userRepository.save(user);

        return ResponseEntity.ok("Request approved successfully");
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectRequest(@PathVariable Long id) {
        // TODO: Add admin role check
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
