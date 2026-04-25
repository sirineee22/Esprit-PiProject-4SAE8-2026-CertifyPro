package com.esprit.pi.jobcareers.controller;

import com.esprit.pi.jobcareers.dto.response.CandidateMatchResponse;
import com.esprit.pi.jobcareers.service.MatchingService;
import com.esprit.pi.jobcareers.dto.request.CreateJobOfferRequest;
import com.esprit.pi.jobcareers.dto.request.UpdateJobOfferRequest;
import com.esprit.pi.jobcareers.dto.response.ApiResponse;
import com.esprit.pi.jobcareers.dto.response.JobOfferResponse;
import com.esprit.pi.jobcareers.service.JobOfferService;
import com.esprit.pi.jobcareers.service.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints pour les employeurs/recruteurs — Scénario 1
 */@RestController
@RequestMapping("/api/employer/jobs")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_EMPLOYER','ROLE_ADMIN')")
public class EmployerJobController {

    private final JobOfferService jobOfferService;
    private final MatchingService matchingService;

    // ✅ GET PAGINATED JOBS (BEST)
    @GetMapping
    public ResponseEntity<ApiResponse<Page<JobOfferResponse>>> getMyJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request) {

        Long userId = SecurityUtils.getCurrentUserId(request);

        Page<JobOfferResponse> jobs =
                jobOfferService.getMyPostedOffersPaged(userId, page, size);

        return ResponseEntity.ok(ApiResponse.success(jobs));
    }

    // CREATE
    @PostMapping
    public ResponseEntity<ApiResponse<JobOfferResponse>> createJob(
            @Valid @RequestBody CreateJobOfferRequest request,
            HttpServletRequest httpRequest) {

        Long userId = com.esprit.pi.jobcareers.service.SecurityUtils.getCurrentUserId(httpRequest);
        JobOfferResponse response = jobOfferService.createJobOffer(request, userId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<JobOfferResponse>> updateJob(
            @PathVariable Long id,
            @Valid @RequestBody UpdateJobOfferRequest request,
            HttpServletRequest httpRequest) {

        Long userId = com.esprit.pi.jobcareers.service.SecurityUtils.getCurrentUserId(httpRequest);

        return ResponseEntity.ok(ApiResponse.success(
                jobOfferService.updateJobOffer(id, request, userId)
        ));
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteJob(@PathVariable Long id) {
        jobOfferService.deleteJobOffer(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ── Feature 3 : Candidats suggérés pour une offre ────────────────────
    @GetMapping("/{id}/matching-candidates")
    public ResponseEntity<ApiResponse<List<CandidateMatchResponse>>> getMatchingCandidates(
            @PathVariable Long id,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(
                ApiResponse.success(matchingService.getMatchingCandidates(id, limit),
                        "Candidats suggérés calculés")
        );
    }
}