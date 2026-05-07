package com.training.forum.controller;

import com.training.forum.entity.Comment;
import com.training.forum.entity.Post;
import com.training.forum.entity.Reaction;
import com.training.forum.repository.CommentRepository;
import com.training.forum.repository.PostRepository;
import com.training.forum.repository.ReactionRepository;
import com.training.forum.service.UserServiceClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApiControllerTest {

    @Mock
    private PostRepository postRepository;

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private ReactionRepository reactionRepository;

    @Mock
    private UserServiceClient userServiceClient;

    @InjectMocks
    private ApiController controller;

    private Post post;

    @BeforeEach
    void setUp() {
        post = new Post();
        post.setId(1L);
        post.setUserId(10L);
        post.setTitle("Hello");
        post.setContent("World");
    }

    @Test
    void shouldGetAllPosts() {
        when(postRepository.findAll()).thenReturn(List.of(post));
        when(commentRepository.findByPostId(1L)).thenReturn(List.of());
        when(reactionRepository.countByPostId(1L)).thenReturn(0L);

        Map<String, Object> user = new HashMap<>();
        user.put("id", 10L);
        user.put("firstName", "Aziz");
        user.put("lastName", "Chourabi");

        when(userServiceClient.getUsersBatch(anyList(), any()))
                .thenReturn(List.of(user));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer token");

        List<Map<String, Object>> result = controller.getAllPosts(request);

        assertEquals(1, result.size());
        assertEquals("Hello", result.get(0).get("title"));
    }

    @Test
    void shouldDeletePost() {
        ResponseEntity<?> response = controller.deletePost(1L);

        verify(postRepository).deleteById(1L);
        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    void shouldToggleReactionAdd() {
        when(reactionRepository.findByPostIdAndUserId(1L, 5L))
                .thenReturn(Optional.empty());

        when(postRepository.findById(1L))
                .thenReturn(Optional.of(post));

        ResponseEntity<?> response =
                controller.toggleReaction(1L, 5L);

        verify(reactionRepository).save(any(Reaction.class));
        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    void shouldToggleReactionRemove() {
        Reaction reaction = new Reaction();

        when(reactionRepository.findByPostIdAndUserId(1L, 5L))
                .thenReturn(Optional.of(reaction));

        ResponseEntity<?> response =
                controller.toggleReaction(1L, 5L);

        verify(reactionRepository).delete(reaction);
        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    void shouldAddComment() {
        when(postRepository.findById(1L))
                .thenReturn(Optional.of(post));

        ResponseEntity<?> response =
                controller.addComment(1L, 99L, "Nice post");

        verify(commentRepository).save(any(Comment.class));
        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    void shouldDeleteComment() {
        ResponseEntity<?> response =
                controller.deleteComment(5L);

        verify(commentRepository).deleteById(5L);
        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    void shouldUpdatePost() {
        Post updated = new Post();
        updated.setTitle("Updated");
        updated.setContent("Updated content");

        when(postRepository.findById(1L))
                .thenReturn(Optional.of(post));

        MockHttpServletRequest request = new MockHttpServletRequest();

        ResponseEntity<?> response =
                controller.updatePost(1L, updated, request);

        verify(postRepository).save(post);
        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    void shouldReturnNotFoundWhenUpdatePostMissing() {
        when(postRepository.findById(1L))
                .thenReturn(Optional.empty());

        ResponseEntity<?> response =
                controller.updatePost(1L, new Post(), null);

        assertEquals(404, response.getStatusCode().value());
    }

    @Test
    void shouldUpdateComment() {
        Comment comment = new Comment();
        comment.setId(1L);
        comment.setContent("Old");

        Comment updated = new Comment();
        updated.setContent("New");

        when(commentRepository.findById(1L))
                .thenReturn(Optional.of(comment));

        ResponseEntity<?> response =
                controller.updateComment(1L, updated);

        verify(commentRepository).save(comment);
        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    void shouldTranslateFallback() {
        Map<String, String> body = new HashMap<>();
        body.put("title", "Hello");
        body.put("content", "World");

        ResponseEntity<?> response =
                controller.translate(body);

        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    void shouldGenerateAiPostWhenPromptEmpty() {
        Map<String, String> body = new HashMap<>();
        body.put("prompt", "");

        ResponseEntity<?> response =
                controller.generateAiPost(body);

        assertEquals(200, response.getStatusCode().value());
    }
}