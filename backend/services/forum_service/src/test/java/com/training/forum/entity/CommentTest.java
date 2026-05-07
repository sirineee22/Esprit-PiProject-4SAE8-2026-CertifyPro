package com.training.forum.entity;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CommentTest {

    @Test
    void testCommentEntity() {

        Post post = new Post();
        post.setId(1L);

        Comment comment = new Comment();

        comment.setId(5L);
        comment.setUserId(20L);
        comment.setContent("Très bon post");
        comment.setPost(post);

        assertEquals(5L, comment.getId());
        assertEquals(20L, comment.getUserId());
        assertEquals("Très bon post", comment.getContent());
        assertEquals(post, comment.getPost());
    }
}