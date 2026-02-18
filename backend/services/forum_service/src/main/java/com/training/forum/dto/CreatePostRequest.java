package com.training.forum.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO pour créer un post
 * Le userId est extrait automatiquement du token JWT, pas besoin de le fournir
 */
public record CreatePostRequest(
        @NotBlank String title,
        @NotBlank String content
) {
}


