package com.esprit.pi.jobcareers.controller;

import com.esprit.pi.jobcareers.dto.request.CreateCompanyRequest;
import com.esprit.pi.jobcareers.dto.response.ApiResponse;
import com.esprit.pi.jobcareers.dto.response.CompanyResponse;
import com.esprit.pi.jobcareers.service.CompanyService;
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
@RequestMapping("/api/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CompanyResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String industryType) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());

        return ResponseEntity.ok(
                ApiResponse.success(
                        companyService.searchCompanies(keyword, industryType, pageable)
                )
        );
    }

    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_EMPLOYER')")
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<CompanyResponse>> getMyCompany(HttpServletRequest httpRequest) {
        return ResponseEntity.ok(
                ApiResponse.success(companyService.getMyCompany(httpRequest))
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CompanyResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success(companyService.getCompanyById(id))
        );
    }

    // 🔥 CREATE
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_EMPLOYER')")
    @PostMapping
    public ResponseEntity<ApiResponse<CompanyResponse>> create(
            HttpServletRequest httpRequest,
            @Valid @RequestBody CreateCompanyRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        companyService.createCompany(httpRequest, request),
                        "Entreprise créée"
                ));
    }

    // 🔥 UPDATE
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_EMPLOYER')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CompanyResponse>> update(
            @PathVariable Long id,
            HttpServletRequest httpRequest,
            @Valid @RequestBody CreateCompanyRequest request) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        companyService.updateCompany(id, httpRequest, request),
                        "Entreprise mise à jour"
                )
        );


    }

    // 🔥 DELETE
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            HttpServletRequest req) {

        Long userId = SecurityUtils.getCurrentUserId(req);

        companyService.deleteCompany(id, userId);

        return ResponseEntity.ok(ApiResponse.success(null, "Entreprise supprimée"));
    }

    // 🔥 UPLOAD LOGO
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_EMPLOYER')")
    @PostMapping("/{id}/logo")
    public ResponseEntity<ApiResponse<CompanyResponse>> uploadLogo(
            @PathVariable Long id,
            @RequestParam("logo") org.springframework.web.multipart.MultipartFile file,
            HttpServletRequest req) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        companyService.uploadLogo(id, file, req),
                        "Logo mis à jour"
                )
        );
    }
}