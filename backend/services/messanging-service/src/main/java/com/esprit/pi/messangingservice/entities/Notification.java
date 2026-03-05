package com.esprit.pi.messangingservice.entities;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.Instant;

/**
 * Entité Notification MongoDB.
 *
 * Types : "message" | "reaction" | "mention" | "file" | "location" | "system"
 */
@Document(collection = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    private String id;

    // ── Destinataire ─────────────────────────────────────
    @Indexed
    private String recipientId;     // userId du destinataire

    // ── Expéditeur ───────────────────────────────────────
    private String senderId;
    private String senderName;
    private String senderAvatar;

    // ── Contenu ──────────────────────────────────────────
    private String type;            // "message" | "reaction" | "mention" | "file" | "location" | "system"
    private String title;           // ex: "Nouveau message de Ali"
    private String body;            // ex: "Salut, tu es disponible ?"
    private String icon;            // emoji ou URL icône

    // ── Contexte ─────────────────────────────────────────
    private String chatRoomId;
    private String messageId;
    private String routerLink;      // ex: "/chat" pour naviguer

    // ── Statut ───────────────────────────────────────────
    @Builder.Default
    private boolean read = false;

    @Builder.Default
    private boolean deleted = false;

    @CreatedDate
    private Instant createdAt;
}