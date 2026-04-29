package com.esprit.pi.jobcareers.controller;

import com.esprit.pi.jobcareers.dto.request.CreateJobAlertRequest;
import com.esprit.pi.jobcareers.dto.response.ApiResponse;
import com.esprit.pi.jobcareers.dto.response.JobAlertResponse;
import com.esprit.pi.jobcareers.exception.ResourceNotFoundException;
import com.esprit.pi.jobcareers.model.JobAlert;
import com.esprit.pi.jobcareers.repository.JobAlertRepository;
import com.esprit.pi.jobcareers.service.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/candidate/alerts")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_LEARNER', 'ROLE_ADMIN', 'ROLE_USER')")
public class JobAlertController {

    private final JobAlertRepository alertRepository;

    // ── GET all alerts for current user ──────────────────────────────────
    @GetMapping
    public ResponseEntity<ApiResponse<List<JobAlertResponse>>> getMyAlerts(HttpServletRequest req) {
        Long userId = SecurityUtils.getCurrentUserId(req);
        List<JobAlertResponse> alerts = alertRepository.findByUserId(userId)
                .stream().map(this::toResponse).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(alerts));
    }

    // ── CREATE alert ──────────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<ApiResponse<JobAlertResponse>> create(
            @RequestBody CreateJobAlertRequest request,
            HttpServletRequest req) {

        Long userId = SecurityUtils.getCurrentUserId(req);

        JobAlert alert = JobAlert.builder()
                .userId(userId)
                .keyword(request.getKeyword())
                .contractType(request.getContractType())
                .location(request.getLocation())
                .active(true)
                .build();

        JobAlert saved = alertRepository.save(alert);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(toResponse(saved), "Alerte créée"));
    }

    // ── DELETE alert ──────────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            HttpServletRequest req) {

        Long userId = SecurityUtils.getCurrentUserId(req);
        JobAlert alert = alertRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Alerte", id));
        alertRepository.delete(alert);
        return ResponseEntity.ok(ApiResponse.success(null, "Alerte supprimée"));
    }

    // ── TOGGLE active/inactive ────────────────────────────────────────────
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<JobAlertResponse>> toggle(
            @PathVariable Long id,
            HttpServletRequest req) {

        Long userId = SecurityUtils.getCurrentUserId(req);
        JobAlert alert = alertRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Alerte", id));

        alert.setActive(!alert.isActive());
        JobAlert saved = alertRepository.save(alert);
        return ResponseEntity.ok(ApiResponse.success(toResponse(saved),
                alert.isActive() ? "Alerte activée" : "Alerte désactivée"));
    }

    // ── Mapper ────────────────────────────────────────────────────────────
    private JobAlertResponse toResponse(JobAlert a) {
        return JobAlertResponse.builder()
                .id(a.getId())
                .keyword(a.getKeyword())
                .contractType(a.getContractType())
                .location(a.getLocation())
                .active(a.isActive())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
