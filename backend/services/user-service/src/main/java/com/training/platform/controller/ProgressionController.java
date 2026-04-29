package com.training.platform.controller;

import com.training.platform.entity.UserBadge;
import com.training.platform.security.JwtAuthenticationFilter;
import com.training.platform.service.ProgressionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ProgressionController {
    private final ProgressionService progressionService;

    public ProgressionController(ProgressionService progressionService) {
        this.progressionService = progressionService;
    }

    public static class XpGrantRequest {
        private Long userId;
        private String action;
        private Long eventId;
        private Integer points;

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
        public Long getEventId() { return eventId; }
        public void setEventId(Long eventId) { this.eventId = eventId; }
        public Integer getPoints() { return points; }
        public void setPoints(Integer points) { this.points = points; }
    }

    public record ProgressResponse(
            Integer xpTotal,
            Integer levelNumber,
            String levelLabel,
            Integer xpToNextLevel,
            List<UserBadge> badges
    ) {}

    @PostMapping("/api/users/internal/progress/xp-grant")
    public ResponseEntity<?> grantXp(@RequestBody XpGrantRequest request) {
        if (request == null || request.getUserId() == null || request.getAction() == null || request.getAction().isBlank()) {
            return ResponseEntity.badRequest().body("Invalid XP payload");
        }
        progressionService.grantXp(request.getUserId(), request.getAction(), request.getEventId(), request.getPoints());
        return ResponseEntity.ok().build();
    }

    private JwtAuthenticationFilter.JwtUserDetails getCurrentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getDetails() == null) return null;
        Object details = auth.getDetails();
        return details instanceof JwtAuthenticationFilter.JwtUserDetails
                ? (JwtAuthenticationFilter.JwtUserDetails) details
                : null;
    }

    @GetMapping("/api/users/progress/my")
    public ResponseEntity<ProgressResponse> myProgress() {
        JwtAuthenticationFilter.JwtUserDetails user = getCurrentUser();
        if (user == null || user.userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        var snapshot = progressionService.getSnapshot(user.userId);
        int xp = snapshot.progress().getXpTotal();
        int nextThreshold = xp < 100 ? 100 : (xp < 300 ? 300 : (xp < 600 ? 600 : xp));
        int xpToNext = xp >= 600 ? 0 : (nextThreshold - xp);
        return ResponseEntity.ok(new ProgressResponse(
                snapshot.progress().getXpTotal(),
                snapshot.progress().getLevelNumber(),
                snapshot.progress().getLevelLabel(),
                xpToNext,
                snapshot.badges()
        ));
    }
}
