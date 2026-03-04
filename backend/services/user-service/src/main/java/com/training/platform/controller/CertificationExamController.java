package com.training.platform.controller;

import com.training.platform.entity.CertificationExam;
import com.training.platform.repository.CertificationExamRepository;
import com.training.platform.repository.CertificationRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/certification-exams")
@CrossOrigin(origins = "*")
public class CertificationExamController {

    private final CertificationExamRepository examRepository;
    private final CertificationRepository certificationRepository;

    public CertificationExamController(CertificationExamRepository examRepository,
            CertificationRepository certificationRepository) {
        this.examRepository = examRepository;
        this.certificationRepository = certificationRepository;
    }

    /**
     * POST /api/certification-exams
     * Creates a new exam linked to a certification by its code.
     */
    @PostMapping
    public ResponseEntity<?> createExam(@Valid @RequestBody ExamDto dto) {
        // Ensure the certification code exists
        boolean certExists = certificationRepository.findAll().stream()
                .anyMatch(c -> dto.certificationCode.equalsIgnoreCase(c.getCode()));
        if (!certExists) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No certification found with code: " + dto.certificationCode);
        }

        CertificationExam exam = new CertificationExam();
        exam.setCertificationCode(dto.certificationCode.trim().toUpperCase());
        exam.setTitle(dto.title.trim());
        exam.setDurationMinutes(dto.durationMinutes);
        exam.setPassingScore(dto.passingScore);
        exam.setMaxAttemptsPerUser(dto.maxAttemptsPerUser);
        exam.setIsActive(dto.isActive != null ? dto.isActive : true);

        CertificationExam saved = examRepository.save(exam);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * GET /api/certification-exams?certificationCode=XYZ
     * Returns all exams for a given certification code.
     */
    @GetMapping
    public ResponseEntity<List<CertificationExam>> getExams(
            @RequestParam(required = false) String certificationCode) {
        if (certificationCode != null && !certificationCode.isBlank()) {
            return ResponseEntity.ok(examRepository.findByCertificationCode(certificationCode.toUpperCase()));
        }
        return ResponseEntity.ok(examRepository.findAll());
    }

    /**
     * GET /api/certification-exams/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getExam(@PathVariable Long id) {
        return examRepository.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Exam not found"));
    }

    /**
     * DELETE /api/certification-exams/{id}
     * Soft-deletes an exam (sets isActive = false).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deactivateExam(@PathVariable Long id) {
        return examRepository.findById(id).map(exam -> {
            exam.setIsActive(false);
            examRepository.save(exam);
            return ResponseEntity.ok("Exam deactivated");
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Exam not found"));
    }

    // DTO
    static class ExamDto {
        @NotBlank
        public String certificationCode;

        @NotBlank
        public String title;

        public Integer durationMinutes;
        public Double passingScore;
        public Integer maxAttemptsPerUser;
        public Boolean isActive;
    }
}
