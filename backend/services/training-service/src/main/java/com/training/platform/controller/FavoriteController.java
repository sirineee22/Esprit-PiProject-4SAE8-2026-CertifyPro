package com.training.platform.controller;

import com.training.platform.entity.Formation;
import com.training.platform.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {
    private final FavoriteService favoriteService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Formation>> getUserFavorites(@PathVariable(name = "userId") Long userId) {
        return ResponseEntity.ok(favoriteService.getUserFavorites(userId));
    }

    @GetMapping("/check")
    public ResponseEntity<Boolean> checkFavorite(@RequestParam(name = "userId") Long userId,
            @RequestParam(name = "formationId") Long formationId) {
        return ResponseEntity.ok(favoriteService.isFavorite(userId, formationId));
    }

    @PostMapping("/toggle")
    public ResponseEntity<?> toggleFavorite(@RequestBody Map<String, Long> payload) {
        Long userId = payload.get("userId");
        Long formationId = payload.get("formationId");
        if (userId == null || formationId == null) {
            return ResponseEntity.badRequest().body("userId and formationId are required");
        }
        favoriteService.toggleFavorite(userId, formationId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/user/{userId}/formation/{formationId}")
    public ResponseEntity<Void> removeFavorite(@PathVariable(name = "userId") Long userId,
            @PathVariable(name = "formationId") Long formationId) {
        favoriteService.removeFavorite(userId, formationId);
        return ResponseEntity.noContent().build();
    }
}
