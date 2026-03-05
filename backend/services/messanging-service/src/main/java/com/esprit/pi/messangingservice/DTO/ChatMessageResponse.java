package com.esprit.pi.messangingservice.DTO;

import lombok.*;
import java.time.Instant;
import java.util.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageResponse {

    private String id;
    private String chatRoomId;

    // ── Expéditeur ──────────────────────────────────────────
    private String senderId;
    private String name;
    private String profile;

    // ── Contenu ─────────────────────────────────────────────
    private String message;
    private String align;
    private String time;

    // ── Reply ───────────────────────────────────────────────
    private String replayName;
    private String replaymsg;
    private String replyToId;

    // ── Images legacy ───────────────────────────────────────
    private List<String> image;

    // ── Type & Fichier ──────────────────────────────────────
    private String type;
    private String fileUrl;
    private String fileName;
    private String fileSize;
    private String fileMimeType;

    // ── Localisation ────────────────────────────────────────
    private Double latitude;
    private Double longitude;
    private String locationUrl;
    private String mapThumb;

    // ── Réactions ───────────────────────────────────────────
    private List<Map<String, Object>> reactions;

    // ════════════════════════════════════════════════════════
    // ✅ NOUVEAUX CHAMPS DTO pour les 5 fonctionnalités
    // ════════════════════════════════════════════════════════

    // ── 1. Statut de lecture ─────────────────────────────────
    private Set<String> readBy;          // userIds qui ont lu
    private boolean isRead;              // raccourci : lu par le destinataire courant

    // ── 3. Messages épinglés ─────────────────────────────────
    private boolean pinned;
    private String pinnedBy;
    private Instant pinnedAt;

    // ── 4. Mentions ──────────────────────────────────────────
    private List<String> mentionedUserIds;

    // ── Timestamp brut ──────────────────────────────────────
    private Instant createdAt;
}