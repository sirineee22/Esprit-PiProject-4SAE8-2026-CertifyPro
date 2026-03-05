package com.training.forum.dto;

import java.time.LocalDateTime;

public record PostResponse(
        Long id,
        Long userId,
        String title,
        String content,
        String imageUrl,
        LocalDateTime createdAt,
        long reactionCount,
        long commentCount,
        boolean isLikedByCurrentUser
) {
}
