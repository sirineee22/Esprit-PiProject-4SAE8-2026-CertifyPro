package com.esprit.pi.messangingservice.DTO;

import lombok.*;

/**
 * Payload pour ajouter / retirer une réaction.
 * POST /api/chat/messages/{messageId}/reactions
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReactionRequest {
    private String emoji;   // ex: "👍"
    private String userId;  // ID de l'utilisateur qui réagit
}