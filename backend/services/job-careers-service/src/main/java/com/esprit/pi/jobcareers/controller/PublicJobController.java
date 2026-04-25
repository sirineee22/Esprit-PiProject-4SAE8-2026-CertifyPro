package com.esprit.pi.jobcareers.controller;

import com.esprit.pi.jobcareers.dto.response.ApiResponse;
import com.esprit.pi.jobcareers.dto.response.JobOfferResponse;
import com.esprit.pi.jobcareers.enums.ContractType;
import com.esprit.pi.jobcareers.service.JobOfferService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class PublicJobController {

    private final JobOfferService jobOfferService;

    // ✅ whitelist des champs triables
    private static final List<String> ALLOWED_SORT_FIELDS =
            List.of("id", "title", "createdAt", "postDate");

    @GetMapping
    public ResponseEntity<ApiResponse<Page<JobOfferResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ContractType contractType,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String country,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {

        // 🔥 FIX SORT SAFE
        if (!ALLOWED_SORT_FIELDS.contains(sortBy)) {
            sortBy = "createdAt";
        }

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(
                ApiResponse.success(
                        jobOfferService.searchJobOffers(
                                keyword,
                                contractType,
                                categoryId,
                                null,
                                country,
                                pageable
                        )
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<JobOfferResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success(jobOfferService.getJobOfferById(id))
        );
    }
}