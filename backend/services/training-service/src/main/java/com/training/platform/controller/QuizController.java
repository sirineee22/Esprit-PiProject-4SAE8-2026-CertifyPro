package com.training.platform.controller;

import com.training.platform.entity.Quiz;
import com.training.platform.entity.QuizAttempt;
import com.training.platform.security.JwtAuthenticationFilter;
import com.training.platform.service.QuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class QuizController {
    private final QuizService quizService;

    @GetMapping
    public List<Quiz> getAllQuizzes() {
        return quizService.getAllQuizzes();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Quiz> getQuizById(@PathVariable("id") Long id) {
        return quizService.getQuizById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/formation/{formationId}")
    public List<Quiz> getQuizzesByFormation(@PathVariable("formationId") Long formationId) {
        return quizService.getQuizzesByFormation(formationId);
    }

    @PostMapping
    public ResponseEntity<Quiz> createQuiz(@RequestBody Quiz quiz, Authentication authentication) {
        if (authentication != null && authentication.getDetails() instanceof JwtAuthenticationFilter.JwtUserDetails) {
            JwtAuthenticationFilter.JwtUserDetails details = (JwtAuthenticationFilter.JwtUserDetails) authentication
                    .getDetails();
            quiz.setTrainerId(details.userId);
        }
        return ResponseEntity.ok(quizService.createQuiz(quiz));
    }

    @PostMapping("/{id}/attempt")
    public ResponseEntity<QuizAttempt> submitAttempt(
            @PathVariable("id") Long quizId,
            @RequestBody Map<String, Object> answers,
            Authentication authentication) {

        if (authentication != null && authentication.getDetails() instanceof JwtAuthenticationFilter.JwtUserDetails) {
            JwtAuthenticationFilter.JwtUserDetails details = (JwtAuthenticationFilter.JwtUserDetails) authentication
                    .getDetails();
            return ResponseEntity.ok(quizService.submitQuizAttempt(details.userId, quizId, answers));
        }
        return ResponseEntity.status(401).build();
    }

    @GetMapping("/attempts/me")
    public List<QuizAttempt> getMyAttempts(Authentication authentication) {
        if (authentication != null && authentication.getDetails() instanceof JwtAuthenticationFilter.JwtUserDetails) {
            JwtAuthenticationFilter.JwtUserDetails details = (JwtAuthenticationFilter.JwtUserDetails) authentication
                    .getDetails();
            return quizService.getMyAttempts(details.userId);
        }
        return List.of();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuiz(@PathVariable("id") Long id) {
        quizService.deleteQuiz(id);
        return ResponseEntity.noContent().build();
    }
}
