package com.training.forum.repository;

import com.training.forum.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByPost_IdOrderByCommentDateAsc(Long postId);
    long countByPost_Id(Long postId);
}


