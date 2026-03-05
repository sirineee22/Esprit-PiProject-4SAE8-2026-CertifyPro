package com.training.events.repository;

import com.training.events.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByEventIdOrderByCreatedAtDesc(Long eventId);
    boolean existsByEventIdAndLearnerId(Long eventId, Long learnerId);
}
