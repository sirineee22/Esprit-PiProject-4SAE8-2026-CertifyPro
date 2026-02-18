package com.training.forum.controller;

import com.training.forum.dto.CreatePostRequest;
import com.training.forum.dto.PostResponse;
import com.training.forum.dto.UpdatePostRequest;
import com.training.forum.entity.Post;
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
@RequestMapping("/api/forum/posts")
public class PostController {

    private final PostRepository postRepository;
    private final UserServiceClient userServiceClient;
    private final JwtUtil jwtUtil;

    public PostController(PostRepository postRepository, UserServiceClient userServiceClient, JwtUtil jwtUtil) {
        this.postRepository = postRepository;
        this.userServiceClient = userServiceClient;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping
    public List<PostResponse> getAllPosts() {
        return postRepository.findAll().stream().map(PostController::toResponse).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> getPostById(@PathVariable Long id) {
        return postRepository.findById(id)
                .map(PostController::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createPost(
            @Valid @RequestBody CreatePostRequest req,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
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

        // Créer le post avec le userId extrait du token
        Post post = new Post();
        post.setUserId(userId);
        post.setTitle(req.title());
        post.setContent(req.content());
        Post saved = postRepository.save(post);
        return ResponseEntity.ok(toResponse(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PostResponse> updatePost(@PathVariable Long id, @RequestBody UpdatePostRequest req) {
        return postRepository.findById(id)
                .map(post -> {
                    if (req.title() != null && !req.title().isBlank()) {
                        post.setTitle(req.title());
                    }
                    if (req.content() != null && !req.content().isBlank()) {
                        post.setContent(req.content());
                    }
                    return ResponseEntity.ok(toResponse(postRepository.save(post)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        if (!postRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        postRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    private static PostResponse toResponse(Post post) {
        return new PostResponse(
                post.getId(),
                post.getUserId(),
                post.getTitle(),
                post.getContent(),
                post.getCreatedAt()
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


