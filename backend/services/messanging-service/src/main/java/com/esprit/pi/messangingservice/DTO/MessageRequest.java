package com.esprit.pi.messangingservice.DTO;

import lombok.Data;
import java.util.List;

/**
 * Payload envoyé par le frontend Angular (REST ou WebSocket).
 */
@Data
public class MessageRequest {

    private String chatRoomId;
    private String senderId;
    private String name;
    private String profile;
    private String message;
    private String align;

    // ── Reply ──────────────────────────────────────────────
    private String replyToId;

    // ── Galerie images (legacy) ────────────────────────────
    private List<String> image;

    // ── Type : "text"|"image"|"video"|"audio"|"file"|"location" ──
    private String type;

    // ── Fichier ────────────────────────────────────────────
    private String fileUrl;
    private String fileName;
    private String fileSize;
    private String fileMimeType;

    // ── Localisation ───────────────────────────────────────
    private Double latitude;
    private Double longitude;
    private String locationUrl;
}