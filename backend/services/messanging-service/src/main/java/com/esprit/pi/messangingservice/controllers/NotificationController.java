package com.esprit.pi.messangingservice.controllers;

import com.esprit.pi.messangingservice.DTO.NotificationDTO;
import com.esprit.pi.messangingservice.Services.NotificationService;
import com.esprit.pi.messangingservice.config.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Endpoints REST pour les notifications.
 *
 * GET  /api/notifications             → liste des notifs
 * GET  /api/notifications/count       → nombre de non-lues
 * PUT  /api/notifications/{id}/read   → marquer une notif lue
 * PUT  /api/notifications/read-all    → marquer toutes lues
 * DELETE /api/notifications/{id}      → supprimer une notif
 * DELETE /api/notifications           → supprimer toutes
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notifService;
    private final JwtService          jwtService;

    // ── Liste des notifications ────────────────────────
    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getAll(HttpServletRequest req) {
        String userId = extractUserId(req);
        if (userId == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(notifService.getForUser(userId));
    }

    // ── Nombre de non-lues ─────────────────────────────
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> count(HttpServletRequest req) {
        String userId = extractUserId(req);
        if (userId == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(Map.of("count", notifService.countUnread(userId)));
    }

    // ── Marquer UNE notif lue ──────────────────────────
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable String id) {
        notifService.markRead(id);
        return ResponseEntity.noContent().build();
    }

    // ── Marquer TOUTES lues ────────────────────────────
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllRead(HttpServletRequest req) {
        String userId = extractUserId(req);
        if (userId == null) return ResponseEntity.badRequest().build();
        notifService.markAllRead(userId);
        return ResponseEntity.noContent().build();
    }

    // ── Supprimer UNE notif ────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        notifService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ── Supprimer TOUTES ───────────────────────────────
    @DeleteMapping
    public ResponseEntity<Void> deleteAll(HttpServletRequest req) {
        String userId = extractUserId(req);
        if (userId == null) return ResponseEntity.badRequest().build();
        notifService.deleteAll(userId);
        return ResponseEntity.noContent().build();
    }

    // ── Helper JWT ─────────────────────────────────────
    private String extractUserId(HttpServletRequest req) {
        String header = req.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        return jwtService.extractUserId(header.substring(7));
    }
}