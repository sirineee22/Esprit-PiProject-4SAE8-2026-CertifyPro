// ===============================================
// TESTS UNITAIRES ENTITIES SPRING BOOT
// package: src/test/java/com/training/forum/entity
// ===============================================

// -------------------------------------------------
// 1️⃣ PostTest.java
// -------------------------------------------------
package com.training.forum.entity;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

class PostTest {

    @Test
    void testPostEntity() {

        Post post = new Post();

        post.setId(1L);
        post.setUserId(10L);
        post.setTitle("Titre Test");
        post.setContent("Contenu Test");
        post.setImageUrl("image.png");

        assertEquals(1L, post.getId());
        assertEquals(10L, post.getUserId());
        assertEquals("Titre Test", post.getTitle());
        assertEquals("Contenu Test", post.getContent());
        assertEquals("image.png", post.getImageUrl());
    }

    @Test
    void testCommentsInitialization() {

        Post post = new Post();

        assertNotNull(post.getComments());
        assertTrue(post.getComments().isEmpty());
    }

    @Test
    void testReactionsInitialization() {

        Post post = new Post();

        assertNotNull(post.getReactions());
        assertTrue(post.getReactions().isEmpty());
    }

    @Test
    void testAddComment() {

        Post post = new Post();
        Comment comment = new Comment();

        post.getComments().add(comment);

        assertEquals(1, post.getComments().size());
    }

    @Test
    void testAddReaction() {

        Post post = new Post();
        Reaction reaction = new Reaction();

        post.getReactions().add(reaction);

        assertEquals(1, post.getReactions().size());
    }
}