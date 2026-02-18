package com.training.forum.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO pour créer un commentaire
 * Le userId est extrait automatiquement du token JWT, pas besoin de le fournir
 */
public record CreateCommentRequest(
        @NotBlank String content
) {
}


