
package com.training.forum.entity;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ReactionTest {

    @Test
    void testReactionEntity() {

        Post post = new Post();
        post.setId(1L);

        Reaction reaction = new Reaction();

        reaction.setId(2L);
        reaction.setUserId(15L);
        reaction.setPost(post);

        assertEquals(2L, reaction.getId());
        assertEquals(15L, reaction.getUserId());
        assertEquals(post, reaction.getPost());
    }
}