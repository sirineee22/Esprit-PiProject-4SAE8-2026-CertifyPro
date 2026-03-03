package com.training.platform.controller;

import com.training.platform.entity.Progression;
import com.training.platform.entity.ProgressStatus;
import com.training.platform.service.ProgressionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/progression")
@RequiredArgsConstructor
public class ProgressionController {

    private final ProgressionService progressionService;

    // In a real scenario, userId would be extracted from JWT
    // For now, we pass it as a parameter or assume a way to get it

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Progression>> getUserProgressions(@PathVariable Long userId) {
        return ResponseEntity.ok(progressionService.getUserProgressions(userId));
    }

    @GetMapping("/{formationId}/user/{userId}")
    public ResponseEntity<Progression> getProgression(@PathVariable Long formationId, @PathVariable Long userId) {
        return progressionService.getProgression(userId, formationId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{formationId}/status")
    public ResponseEntity<Progression> updateStatus(
            @PathVariable Long formationId,
            @RequestParam Long userId,
            @RequestParam ProgressStatus status) {
        return ResponseEntity.ok(progressionService.updateProgressionStatus(userId, formationId, status));
    }
}
