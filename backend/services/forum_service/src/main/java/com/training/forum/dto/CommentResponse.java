package com.training.forum.dto;

import java.time.LocalDateTime;

public record CommentResponse(
        Long id,
        Long postId,
        Long userId,
        String content,
        LocalDateTime commentDate
) {
}


