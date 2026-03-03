package com.training.platform.controller;

import com.training.platform.entity.Evaluation;
import com.training.platform.service.EvaluationService;
import com.training.platform.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/evaluations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EvaluationController {
    private final EvaluationService evaluationService;

    @GetMapping
    public List<Evaluation> getAllEvaluations() {
        return evaluationService.getAllEvaluations();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Evaluation> getEvaluationById(@PathVariable("id") Long id) {
        return evaluationService.getEvaluationById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Evaluation> createEvaluation(@RequestBody Evaluation evaluation) {
        return ResponseEntity.ok(evaluationService.createEvaluation(evaluation));
    }

    @GetMapping("/me")
    public List<Evaluation> getMyEvaluations(Authentication authentication) {
        if (authentication != null && authentication.getDetails() instanceof JwtAuthenticationFilter.JwtUserDetails) {
            JwtAuthenticationFilter.JwtUserDetails details = (JwtAuthenticationFilter.JwtUserDetails) authentication
                    .getDetails();
            return evaluationService.getEvaluationsByStudent(details.userId);
        }
        return List.of();
    }

    @GetMapping("/student/{studentId}")
    public List<Evaluation> getEvaluationsByStudent(@PathVariable("studentId") Long studentId) {
        return evaluationService.getEvaluationsByStudent(studentId);
    }

    @GetMapping("/formation/{formationId}")
    public List<Evaluation> getEvaluationsByFormation(@PathVariable("formationId") Long formationId) {
        return evaluationService.getEvaluationsByFormation(formationId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvaluation(@PathVariable Long id) {
        evaluationService.deleteEvaluation(id);
        return ResponseEntity.noContent().build();
    }
}
