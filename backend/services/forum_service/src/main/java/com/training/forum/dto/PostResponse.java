package com.training.forum.dto;

import java.time.LocalDateTime;

public record PostResponse(
        Long id,
        Long userId,
        String title,
        String content,
        LocalDateTime createdAt
) {
}


