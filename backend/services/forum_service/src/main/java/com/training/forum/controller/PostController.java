package com.training.forum.controller;

import com.training.forum.dto.PostResponse;
import com.training.forum.entity.Post;
import com.training.forum.entity.Reaction;
import com.training.forum.repository.CommentRepository;
import com.training.forum.repository.PostRepository;
import com.training.forum.repository.ReactionRepository;
import com.training.forum.service.UserServiceClient;
import com.training.forum.service.FileStorageService;
import com.training.forum.util.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/forum/posts")
public class PostController {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final ReactionRepository reactionRepository;
    private final UserServiceClient userServiceClient;
    private final FileStorageService fileStorageService;
    private final JwtUtil jwtUtil;

    public PostController(PostRepository postRepository, 
                          CommentRepository commentRepository,
                          ReactionRepository reactionRepository,
                          UserServiceClient userServiceClient, 
                          FileStorageService fileStorageService,
                          JwtUtil jwtUtil) {
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.reactionRepository = reactionRepository;
        this.userServiceClient = userServiceClient;
        this.fileStorageService = fileStorageService;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping
    public List<PostResponse> getAllPosts(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long currentUserId = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            currentUserId = jwtUtil.extractUserId(authHeader.substring(7));
        }
        
        final Long finalUserId = currentUserId;
        return postRepository.findAll().stream()
                .map(post -> toResponse(post, finalUserId))
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> getPostById(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        Long currentUserId = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            currentUserId = jwtUtil.extractUserId(authHeader.substring(7));
        }
        
        final Long finalUserId = currentUserId;
        return postRepository.findById(id)
                .map(post -> toResponse(post, finalUserId))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createPost(
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestHeader(value = "Authorization", required = false) String authHeader) throws IOException {
        
        String token = extractTokenFromHeader(authHeader);
        if (token == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token required");
        
        Long userId = jwtUtil.extractUserId(token);
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");

        Post post = new Post();
        post.setUserId(userId);
        post.setTitle(title);
        post.setContent(content);
        
        if (image != null && !image.isEmpty()) {
            String fileName = fileStorageService.storeFile(image);
            post.setImageUrl(fileName);
        }

        Post saved = postRepository.save(post);
        return ResponseEntity.ok(toResponse(saved, userId));
    }

    @PostMapping("/{id}/react")
    public ResponseEntity<?> reactToPost(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        String token = extractTokenFromHeader(authHeader);
        if (token == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token required");
        
        Long userId = jwtUtil.extractUserId(token);
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");

        Post post = postRepository.findById(id).orElse(null);
        if (post == null) return ResponseEntity.notFound().build();

        Optional<Reaction> existing = reactionRepository.findByPostIdAndUserId(id, userId);
        if (existing.isPresent()) {
            reactionRepository.delete(existing.get());
            return ResponseEntity.ok("Unliked");
        } else {
            Reaction reaction = new Reaction();
            reaction.setPost(post);
            reaction.setUserId(userId);
            reactionRepository.save(reaction);
            return ResponseEntity.ok("Liked");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        if (!postRepository.existsById(id)) return ResponseEntity.notFound().build();
        postRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    private PostResponse toResponse(Post post, Long currentUserId) {
        long reactionCount = reactionRepository.countByPostId(post.getId());
        long commentCount = commentRepository.countByPost_Id(post.getId());
        boolean isLiked = false;
        if (currentUserId != null) {
            isLiked = reactionRepository.findByPostIdAndUserId(post.getId(), currentUserId).isPresent();
        }

        return new PostResponse(
                post.getId(),
                post.getUserId(),
                post.getTitle(),
                post.getContent(),
                post.getImageUrl(),
                post.getCreatedAt(),
                reactionCount,
                commentCount,
                isLiked
        );
    }

    private String extractTokenFromHeader(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }
}
