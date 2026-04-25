package com.esprit.pi.jobcareers.controller;

import com.esprit.pi.jobcareers.dto.request.UpdateApplicationStatusRequest;
import com.esprit.pi.jobcareers.dto.response.*;
import com.esprit.pi.jobcareers.enums.ApplicationStatus;
import com.esprit.pi.jobcareers.enums.ContractType;
import com.esprit.pi.jobcareers.service.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_EMPLOYER')")
public class AdminJobController {

    private final JobApplicationService applicationService;
    private final CandidateService candidateService;
    private final StatisticsService statisticsService;
    private final CompanyService companyService;

    // ================= APPLICATIONS =================

    @GetMapping("/applications")
    public ResponseEntity<ApiResponse<Page<JobApplicationResponse>>> getAllApplications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(applicationService.getAllApplications(pageable)));
    }

    @GetMapping("/applications/search")
    public ResponseEntity<ApiResponse<Page<JobApplicationResponse>>> searchApplications(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(required = false) ContractType contractType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate applyDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(
                applicationService.searchApplications(keyword, status, contractType, applyDate, pageable)));
    }

    @GetMapping("/applications/{id}")
    public ResponseEntity<ApiResponse<JobApplicationResponse>> getApplication(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(applicationService.getApplicationById(id)));
    }

    @GetMapping("/applications/ref/{appId}")
    public ResponseEntity<ApiResponse<JobApplicationResponse>> getApplicationByRef(@PathVariable String appId) {
        return ResponseEntity.ok(ApiResponse.success(applicationService.getApplicationByRef(appId)));
    }

    @PatchMapping("/applications/{id}/status")
    public ResponseEntity<ApiResponse<JobApplicationResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateApplicationStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                applicationService.updateStatus(id, request), "Statut mis à jour"));
    }

    @GetMapping("/applications/job/{jobOfferId}")
    public ResponseEntity<ApiResponse<Page<JobApplicationResponse>>> getByJob(
            @PathVariable Long jobOfferId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(
                applicationService.getApplicationsByJobOffer(jobOfferId, pageable)));
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @DeleteMapping("/applications/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteApplication(@PathVariable Long id) {
        applicationService.deleteApplication(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Candidature supprimée"));
    }

    // ================= CANDIDATES =================

    @GetMapping("/candidates")
    public ResponseEntity<ApiResponse<Page<CandidateResponse>>> getCandidates(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size,
            @RequestParam(required = false) String filter) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<CandidateResponse> result;
        if ("yesterday".equalsIgnoreCase(filter)) {
            result = candidateService.getRecentCandidates(pageable);
        } else if (filter != null && !filter.isBlank()) {
            result = candidateService.searchCandidates(filter, pageable);
        } else {
            result = candidateService.getAllCandidates(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/candidates/{id}")
    public ResponseEntity<ApiResponse<CandidateResponse>> getCandidate(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(candidateService.getCandidateById(id)));
    }

    // ✅ CORRIGÉ — /candidates/{id} au lieu de /{id}
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @DeleteMapping("/candidates/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCandidate(
            @PathVariable Long id,
            HttpServletRequest req) {
        Long userId = SecurityUtils.getCurrentUserId(req);
        candidateService.deleteCandidate(id, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Candidat supprimé"));
    }

    // ================= STATISTICS =================

    @GetMapping("/statistics/dashboard")
    public ResponseEntity<ApiResponse<DashboardStats>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success(
                statisticsService.getDashboardStats(), "Statistiques récupérées"));
    }

    // ================= MATCHING =================



    // ================= COMPANIES =================

    @GetMapping("/companies")
    public ResponseEntity<ApiResponse<Page<CompanyResponse>>> getCompanies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String industryType) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        return ResponseEntity.ok(ApiResponse.success(
                companyService.searchCompanies(keyword, industryType, pageable)));
    }

    @GetMapping("/companies/{id}")
    public ResponseEntity<ApiResponse<CompanyResponse>> getCompany(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(companyService.getCompanyById(id)));
    }

    // ✅ CORRIGÉ — /companies/{id} au lieu de /{id}
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @DeleteMapping("/companies/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            HttpServletRequest req) {
        Long userId = SecurityUtils.getCurrentUserId(req);
        companyService.deleteCompany(id, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Entreprise supprimée"));
    }
}