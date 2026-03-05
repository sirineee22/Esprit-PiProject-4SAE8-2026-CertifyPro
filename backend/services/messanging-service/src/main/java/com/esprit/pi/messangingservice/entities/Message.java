package com.esprit.pi.messangingservice.entities;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.*;

@Document(collection = "chat_aaa")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Message {

    @Id
    private String id;

    private String chatRoomId;

    // ── Expéditeur ──────────────────────────────────────────
    private String name;
    private String senderId;
    private String profile;

    // ── Contenu texte ───────────────────────────────────────
    private String message;
    private String align;
    private String time;

    // ── Reply ───────────────────────────────────────────────
    private String replayName;
    private String replaymsg;
    private String replyToId;

    // ── Galerie images (legacy) ─────────────────────────────
    @Builder.Default
    private List<String> image = new ArrayList<>();

    // ── Type ────────────────────────────────────────────────
    @Builder.Default
    private String type = "text";

    // ── Fichier ─────────────────────────────────────────────
    private String fileUrl;
    private String fileName;
    private String fileSize;
    private String fileMimeType;

    // ── Localisation GPS ────────────────────────────────────
    private Double latitude;
    private Double longitude;
    private String locationUrl;

    // ── Réactions ───────────────────────────────────────────
    @Builder.Default
    private List<Map<String, Object>> reactions = new ArrayList<>();

    // ── Statut ──────────────────────────────────────────────
    @Builder.Default
    private boolean deleted = false;

    // ════════════════════════════════════════════════════════
    // ✅ NOUVEAUX CHAMPS pour les 5 fonctionnalités
    // ════════════════════════════════════════════════════════

    // ── 1. STATUT DE LECTURE ─────────────────────────────────
    // Ensemble des userIds qui ont lu ce message
    @Builder.Default
    private Set<String> readBy = new HashSet<>();

    // ── 3. MESSAGES ÉPINGLÉS ─────────────────────────────────
    @Builder.Default
    private boolean pinned = false;

    private String pinnedBy;      // userId de celui qui a épinglé
    private Instant pinnedAt;     // quand il a épinglé

    // ── 4. MENTIONS @utilisateur ─────────────────────────────
    // Liste des userIds mentionnés dans ce message
    @Builder.Default
    private List<String> mentionedUserIds = new ArrayList<>();

    @CreatedDate
    private Instant createdAt;
}