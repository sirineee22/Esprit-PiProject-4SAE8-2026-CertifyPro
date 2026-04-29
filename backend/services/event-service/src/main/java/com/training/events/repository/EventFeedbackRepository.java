package com.training.events.repository;

import com.training.events.entity.EventFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface EventFeedbackRepository extends JpaRepository<EventFeedback, Long> {
    Optional<EventFeedback> findByEventIdAndLearnerId(Long eventId, Long learnerId);

    @Modifying
    @Query("DELETE FROM EventFeedback f WHERE f.event.id = :eventId")
    void deleteByEventId(@Param("eventId") Long eventId);
}
