package com.training.platform.controller;

import com.training.platform.entity.CertificateStatus;
import com.training.platform.entity.Certification;
import com.training.platform.entity.User;
import com.training.platform.repository.CertificationRepository;
import com.training.platform.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/certifications")
@CrossOrigin(origins = "*")
public class CertificationController {

    private final CertificationRepository certificationRepository;
    private final UserRepository userRepository;

    public CertificationController(CertificationRepository certificationRepository,
            UserRepository userRepository) {
        this.certificationRepository = certificationRepository;
        this.userRepository = userRepository;
    }

    /**
     * POST /api/certifications
     * Creates a new certification. Only accessible by TRAINER role users.
     */
    @PostMapping
    public ResponseEntity<?> createCertification(@Valid @RequestBody CertificationDto dto) {
        // Validate trainer
        Optional<User> userOpt = userRepository.findById(dto.trainerId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Trainer user not found");
        }
        User trainer = userOpt.get();
        if (trainer.getRole() == null || !"TRAINER".equals(trainer.getRole().getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only trainers can create certifications");
        }

        // Check code uniqueness
        if (certificationRepository.findAll().stream()
                .anyMatch(c -> dto.code.equalsIgnoreCase(c.getCode()))) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("A certification with this code already exists");
        }

        // Build entity
        Certification cert = new Certification();
        cert.setCode(dto.code.trim().toUpperCase());
        cert.setName(dto.name.trim());
        cert.setDescription(dto.description);
        cert.setValidityMonths(dto.validityMonths);
        cert.setRequiredScore(dto.requiredScore);
        cert.setCriteriaDescription(dto.criteriaDescription);
        cert.setIsActive(dto.isActive != null ? dto.isActive : true);
        cert.setStatus(CertificateStatus.ACTIVE);
        cert.setUser(trainer);

        Certification saved = certificationRepository.save(cert);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * GET /api/certifications
     * Returns all active certifications for the public catalog.
     */
    @GetMapping
    public ResponseEntity<?> getAllCertifications(
            @RequestParam(required = false) Boolean activeOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size,
            @RequestParam(defaultValue = "id,desc") String[] sort) {

        try {
            List<Sort.Order> orders = new java.util.ArrayList<>();
            if (sort[0].contains(",")) {
                // multiple sort params
                for (String sortOrder : sort) {
                    String[] _sort = sortOrder.split(",");
                    orders.add(new Sort.Order(Sort.Direction.fromString(_sort[1]), _sort[0]));
                }
            } else {
                // single sort param
                orders.add(new Sort.Order(Sort.Direction.fromString(sort[1]), sort[0]));
            }

            Pageable paging = PageRequest.of(page, size, Sort.by(orders));
            Page<Certification> pageCerts;

            if (Boolean.TRUE.equals(activeOnly)) {
                pageCerts = certificationRepository.findByIsActive(true, paging);
            } else {
                pageCerts = certificationRepository.findAll(paging);
            }

            return ResponseEntity.ok(pageCerts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * GET /api/certifications/{id}
     * Returns a single certification by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getCertification(@PathVariable Long id) {
        return certificationRepository.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Certification not found"));
    }

    /**
     * GET /api/certifications/trainer/{trainerId}
     * Returns all certifications created by a specific trainer.
     */
    @GetMapping("/trainer/{trainerId}")
    public ResponseEntity<?> getCertificationsByTrainer(@PathVariable Long trainerId) {
        Optional<User> userOpt = userRepository.findById(trainerId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Trainer not found");
        }
        List<Certification> certs = certificationRepository.findAll().stream()
                .filter(c -> c.getUser() != null && c.getUser().getId().equals(trainerId))
                .toList();
        return ResponseEntity.ok(certs);
    }

    /**
     * DELETE /api/certifications/{id}
     * Soft-deletes a certification (sets isActive = false).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deactivateCertification(@PathVariable Long id) {
        return certificationRepository.findById(id).map(cert -> {
            cert.setIsActive(false);
            certificationRepository.save(cert);
            return ResponseEntity.ok("Certification deactivated");
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Certification not found"));
    }

    // DTO
    static class CertificationDto {
        @NotBlank
        public String code;

        @NotBlank
        public String name;

        public String description;
        public Integer validityMonths;
        public Double requiredScore;
        public String criteriaDescription;
        public Boolean isActive;
        public Long trainerId;
    }
}
