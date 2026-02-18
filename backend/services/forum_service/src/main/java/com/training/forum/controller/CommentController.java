package com.training.forum.controller;

import com.training.forum.dto.CommentResponse;
import com.training.forum.dto.UpdateCommentRequest;
import com.training.forum.entity.Comment;
import com.training.forum.repository.CommentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/forum/comments")
public class CommentController {

    private final CommentRepository commentRepository;

    public CommentController(CommentRepository commentRepository) {
        this.commentRepository = commentRepository;
    }

    @GetMapping("/{id}")
    public ResponseEntity<CommentResponse> getCommentById(@PathVariable Long id) {
        return commentRepository.findById(id)
                .map(CommentController::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<CommentResponse> updateComment(@PathVariable Long id, @RequestBody UpdateCommentRequest req) {
        return commentRepository.findById(id)
                .map(comment -> {
                    if (req.content() != null && !req.content().isBlank()) {
                        comment.setContent(req.content());
                    }
                    return ResponseEntity.ok(toResponse(commentRepository.save(comment)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id) {
        if (!commentRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        commentRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    private static CommentResponse toResponse(Comment comment) {
        return new CommentResponse(
                comment.getId(),
                comment.getPost() != null ? comment.getPost().getId() : null,
                comment.getUserId(),
                comment.getContent(),
                comment.getCommentDate()
        );
    }
}


