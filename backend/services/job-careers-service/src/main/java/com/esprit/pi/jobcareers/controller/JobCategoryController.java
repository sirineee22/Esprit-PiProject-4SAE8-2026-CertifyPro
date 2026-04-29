package com.esprit.pi.jobcareers.controller;

import com.esprit.pi.jobcareers.dto.response.ApiResponse;
import com.esprit.pi.jobcareers.model.JobCategory;
import com.esprit.pi.jobcareers.repository.JobCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ✅ NOUVEAU — JobCategoryController
 * Exposé sur /api/categories — corrige l'erreur 500 GET /api/categories
 */
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class JobCategoryController {

    private final JobCategoryRepository categoryRepository;

    /**
     * GET /api/categories — PUBLIC (configuré dans SecurityConfig)
     * ✅ CORRIGE L'ERREUR 500
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<JobCategory>>> getAll() {
        List<JobCategory> categories = categoryRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    /**
     * GET /api/categories/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<JobCategory>> getById(@PathVariable Long id) {
        return categoryRepository.findById(id)
                .map(c -> ResponseEntity.ok(ApiResponse.success(c)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/categories — ADMIN seulement
     */
    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<JobCategory>> create(@RequestBody JobCategory category) {
        JobCategory saved = categoryRepository.save(category);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(saved, "Catégorie créée"));
    }

    /**
     * PUT /api/categories/{id} — ADMIN seulement
     */
    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<JobCategory>> update(
            @PathVariable Long id,
            @RequestBody JobCategory body) {
        return categoryRepository.findById(id).map(cat -> {
            cat.setName(body.getName());
            cat.setDescription(body.getDescription());
            cat.setIcon(body.getIcon());
            return ResponseEntity.ok(ApiResponse.success(categoryRepository.save(cat)));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * DELETE /api/categories/{id} — ADMIN seulement
     */
    @PreAuthorize("hasAuthority('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        categoryRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Catégorie supprimée"));
    }
}