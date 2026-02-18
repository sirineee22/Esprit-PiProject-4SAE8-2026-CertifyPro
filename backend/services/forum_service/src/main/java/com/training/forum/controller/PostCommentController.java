package com.training.forum.controller;

import com.training.forum.dto.CommentResponse;
import com.training.forum.dto.CreateCommentRequest;
import com.training.forum.entity.Comment;
import com.training.forum.entity.Post;
import com.training.forum.repository.CommentRepository;
import com.training.forum.repository.PostRepository;
import com.training.forum.service.UserServiceClient;
import com.training.forum.util.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/forum/posts/{postId}/comments")
public class PostCommentController {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final UserServiceClient userServiceClient;
    private final JwtUtil jwtUtil;

    public PostCommentController(PostRepository postRepository, CommentRepository commentRepository, UserServiceClient userServiceClient, JwtUtil jwtUtil) {
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.userServiceClient = userServiceClient;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping
    public ResponseEntity<List<CommentResponse>> getCommentsForPost(@PathVariable Long postId) {
        if (!postRepository.existsById(postId)) {
            return ResponseEntity.notFound().build();
        }
        List<CommentResponse> res = commentRepository.findByPost_IdOrderByCommentDateAsc(postId)
                .stream()
                .map(PostCommentController::toResponse)
                .toList();
        return ResponseEntity.ok(res);
    }

    @PostMapping
    public ResponseEntity<?> addCommentToPost(
            @PathVariable Long postId,
            @Valid @RequestBody CreateCommentRequest req,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        Post post = postRepository.findById(postId).orElse(null);
        if (post == null) {
            return ResponseEntity.notFound().build();
        }

        // Extraire le token JWT du header Authorization
        String token = extractTokenFromHeader(authHeader);
        
        if (token == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Authorization token is required. Please login first.");
        }
        
        // Extraire le userId du token JWT (plus besoin de le fournir dans le body)
        Long userId = jwtUtil.extractUserId(token);
        
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid or expired token. Please login again.");
        }

        // Valider que l'utilisateur existe dans le user-service avec authentification JWT
        if (!userServiceClient.userExists(userId, token)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("User with ID " + userId + " does not exist or is not active");
        }

        // Créer le commentaire avec le userId extrait du token
        Comment comment = new Comment();
        comment.setPost(post);
        comment.setUserId(userId);
        comment.setContent(req.content());
        Comment saved = commentRepository.save(comment);
        return ResponseEntity.ok(toResponse(saved));
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

    /**
     * Extrait le token JWT du header Authorization
     * Format attendu: "Bearer <token>"
     */
    private String extractTokenFromHeader(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }
}


