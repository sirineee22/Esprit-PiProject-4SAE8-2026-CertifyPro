package com.esprit.pi.jobcareers.controller;

import com.esprit.pi.jobcareers.dto.request.ApplyJobRequest;
import com.esprit.pi.jobcareers.dto.request.CandidateProfileRequest;
import com.esprit.pi.jobcareers.dto.response.ApiResponse;
import com.esprit.pi.jobcareers.dto.response.CandidateResponse;
import com.esprit.pi.jobcareers.dto.response.JobApplicationResponse;
import com.esprit.pi.jobcareers.dto.response.JobOfferResponse;
import com.esprit.pi.jobcareers.service.CandidateService;
import com.esprit.pi.jobcareers.service.JobApplicationService;
import com.esprit.pi.jobcareers.service.SavedJobService;
import com.esprit.pi.jobcareers.service.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/candidate")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_LEARNER', 'ROLE_ADMIN', 'ROLE_USER')")
public class CandidateJobController {

    private final JobApplicationService applicationService;
    private final CandidateService candidateService;
    private final SavedJobService savedJobService;

    // ===== helper =====
    private Long getUserId(HttpServletRequest req) {
        Long userId = SecurityUtils.getCurrentUserId(req);
        if (userId == null) {
            throw new RuntimeException("Unauthorized: userId missing from token");
        }
        return userId;
    }

    // ===== PROFILE =====

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<CandidateResponse>> getMyProfile(HttpServletRequest req) {

        Long userId = getUserId(req);

        return ResponseEntity.ok(
                ApiResponse.success(candidateService.getCandidateByUserId(userId))
        );
    }

    @PostMapping("/profile")
    public ResponseEntity<ApiResponse<CandidateResponse>> saveProfile(
            @Valid @RequestBody CandidateProfileRequest request,
            HttpServletRequest req) {

        Long userId = getUserId(req);

        return ResponseEntity.ok(
                ApiResponse.success(
                        candidateService.createOrUpdateProfile(req, request),
                        "Profil sauvegardé"
                )
        );
    }

    // ===== APPLICATIONS =====

    @PostMapping("/apply")
    public ResponseEntity<ApiResponse<JobApplicationResponse>> applyForJob(
            @Valid @RequestBody ApplyJobRequest request,
            HttpServletRequest req) {

        Long userId = getUserId(req);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        applicationService.applyForJob(request, userId),
                        "Candidature soumise avec succès"
                ));
    }

    @GetMapping("/applications")
    public ResponseEntity<ApiResponse<Page<JobApplicationResponse>>> getMyApplications(
            HttpServletRequest req,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Long userId = getUserId(req);

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        return ResponseEntity.ok(
                ApiResponse.success(
                        applicationService.getMyApplications(userId, pageable)
                )
        );
    }

    @GetMapping("/applications/check/{jobOfferId}")
    public ResponseEntity<ApiResponse<Boolean>> hasApplied(
            @PathVariable Long jobOfferId,
            HttpServletRequest req) {

        Long userId = getUserId(req);

        return ResponseEntity.ok(
                ApiResponse.success(
                        applicationService.hasApplied(jobOfferId, userId)
                )
        );
    }

    // ===== SAVED JOBS =====

    @PostMapping("/saved-jobs/{jobOfferId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> saveJob(
            @PathVariable Long jobOfferId,
            HttpServletRequest req) {

        Long userId = getUserId(req);
        savedJobService.saveJob(jobOfferId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Offre sauvegardée"));
    }

    @DeleteMapping("/saved-jobs/{jobOfferId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> unsaveJob(
            @PathVariable Long jobOfferId,
            HttpServletRequest req) {

        Long userId = getUserId(req);
        savedJobService.unsaveJob(jobOfferId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Offre retirée des favoris"));
    }

    @GetMapping("/saved-jobs")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<JobOfferResponse>>> getSavedJobs(
            HttpServletRequest req,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Long userId = getUserId(req);
        Pageable pageable = PageRequest.of(page, size, Sort.by("savedAt").descending());
        return ResponseEntity.ok(
                ApiResponse.success(savedJobService.getSavedJobs(userId, pageable))
        );
    }

    @GetMapping("/saved-jobs/{jobOfferId}/check")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Boolean>> isSaved(
            @PathVariable Long jobOfferId,
            HttpServletRequest req) {

        Long userId = getUserId(req);
        return ResponseEntity.ok(
                ApiResponse.success(savedJobService.isSaved(jobOfferId, userId))
        );
    }
    // ================= APPLICATIONS =================
    @PreAuthorize("hasAuthority('ROLE_LEARNER')")
    @DeleteMapping("/applications/{id}")
    public ResponseEntity<ApiResponse<Void>> withdrawApplication(
            @PathVariable Long id,
            HttpServletRequest req) {

        Long userId = getUserId(req);

        applicationService.withdrawApplication(id, userId);

        return ResponseEntity.ok(ApiResponse.success(null, "Candidature retirée"));
    }
}