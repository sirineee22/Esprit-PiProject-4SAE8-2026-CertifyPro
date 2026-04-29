package com.esprit.pi.jobcareers.controller;

import com.esprit.pi.jobcareers.dto.response.ApiResponse;
import com.esprit.pi.jobcareers.dto.response.JobMatchResponse;
import com.esprit.pi.jobcareers.service.MatchingService;
import com.esprit.pi.jobcareers.service.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Matching Controller
 *
 * GET /api/candidate/matching/recommendations?limit=12
 *   → Retourne les offres les mieux matchées pour le candidat connecté
 *   → Algorithme : compare skills/certifications du candidat avec tags des offres
 *   → Score 0-100, trié par score décroissant
 */
@RestController
@RequestMapping("/api/candidate/matching")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_LEARNER', 'ROLE_ADMIN', 'ROLE_USER')")
public class MatchingController {

    private final MatchingService matchingService;

    @GetMapping("/recommendations")
    public ResponseEntity<ApiResponse<List<JobMatchResponse>>> getRecommendations(
            @RequestParam(defaultValue = "12") int limit,
            @RequestParam(required = false) String contractType,
            @RequestParam(required = false) String country,
            @RequestParam(defaultValue = "0") int minScore,
            @RequestParam(defaultValue = "false") boolean remoteOnly,
            HttpServletRequest request) {

        Long userId = SecurityUtils.getCurrentUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("Utilisateur non authentifié"));
        }

        List<JobMatchResponse> recommendations = matchingService
                .getRecommendations(userId, limit)
                .stream()
                .filter(j -> j.getMatchScore() >= minScore)
                .filter(j -> contractType == null || contractType.isEmpty()
                        || contractType.equalsIgnoreCase(j.getContractType()))
                .filter(j -> country == null || country.isEmpty()
                        || (j.getCountry() != null && j.getCountry().toLowerCase().contains(country.toLowerCase())))
                .filter(j -> !remoteOnly || Boolean.TRUE.equals(j.getIsRemote()))
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(
                ApiResponse.success(recommendations,
                        recommendations.size() + " recommandations trouvées")
        );
    }
}
