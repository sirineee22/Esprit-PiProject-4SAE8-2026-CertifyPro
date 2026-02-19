package com.training.forum.controller;

import com.training.forum.dto.CommentResponse;
import com.training.forum.dto.CreateCommentRequest;
import com.training.forum.dto.UpdateCommentRequest;
import com.training.forum.entity.Comment;
import com.training.forum.entity.Post;
import com.training.forum.repository.CommentRepository;
import com.training.forum.repository.PostRepository;
import com.training.forum.service.UserServiceClient;
import com.training.forum.util.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/forum/comments")
public class CommentController {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserServiceClient userServiceClient;
    private final JwtUtil jwtUtil;

    public CommentController(CommentRepository commentRepository, PostRepository postRepository, 
                             UserServiceClient userServiceClient, JwtUtil jwtUtil) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.userServiceClient = userServiceClient;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping
    public List<CommentResponse> getAllComments() {
        return commentRepository.findAll().stream().map(CommentController::toResponse).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CommentResponse> getCommentById(@PathVariable Long id) {
        return commentRepository.findById(id)
                .map(CommentController::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/post/{postId}")
    public ResponseEntity<?> createComment(
            @PathVariable Long postId,
            @Valid @RequestBody CreateCommentRequest req,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        // Vérifier que le post existe
        Post post = postRepository.findById(postId).orElse(null);
        if (post == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Post with ID " + postId + " does not exist");
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

    @PutMapping("/{id}")
    public ResponseEntity<?> updateComment(
            @PathVariable Long id, 
            @RequestBody UpdateCommentRequest req,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        // Trouver le commentaire
        Comment comment = commentRepository.findById(id).orElse(null);
        if (comment == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Comment with ID " + id + " does not exist");
        }
        
        // Extraire le token JWT du header Authorization
        String token = extractTokenFromHeader(authHeader);
        
        if (token == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Authorization token is required. Please login first.");
        }
        
        // Extraire le userId du token JWT
        Long userId = jwtUtil.extractUserId(token);
        
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid or expired token. Please login again.");
        }
        
        // Vérifier les permissions : ADMIN peut modifier n'importe quel commentaire, 
        // sinon l'utilisateur doit être le propriétaire du commentaire
        boolean isAdmin = jwtUtil.isAdmin(token);
        boolean isOwner = comment.getUserId().equals(userId);
        
        if (!isAdmin && !isOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You can only update your own comments");
        }
        
        // Mettre à jour le contenu du commentaire
        if (req.content() != null && !req.content().isBlank()) {
            comment.setContent(req.content());
        }
        
        Comment updated = commentRepository.save(comment);
        return ResponseEntity.ok(toResponse(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteComment(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        // Trouver le commentaire
        Comment comment = commentRepository.findById(id).orElse(null);
        if (comment == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Comment with ID " + id + " does not exist");
        }
        
        // Extraire le token JWT du header Authorization
        String token = extractTokenFromHeader(authHeader);
        
        if (token == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Authorization token is required. Please login first.");
        }
        
        // Extraire le userId du token JWT
        Long userId = jwtUtil.extractUserId(token);
        
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid or expired token. Please login again.");
        }
        
        // Vérifier les permissions : ADMIN peut supprimer n'importe quel commentaire, 
        // sinon l'utilisateur doit être le propriétaire du commentaire
        boolean isAdmin = jwtUtil.isAdmin(token);
        boolean isOwner = comment.getUserId().equals(userId);
        
        if (!isAdmin && !isOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You can only delete your own comments");
        }
        
        // Supprimer le commentaire
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


