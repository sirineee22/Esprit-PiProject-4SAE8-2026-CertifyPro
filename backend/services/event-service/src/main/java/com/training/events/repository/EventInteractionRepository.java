package com.training.events.repository;

import com.training.events.entity.EventInteraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface EventInteractionRepository extends JpaRepository<EventInteraction, Long> {

    long countByEventIdAndInteractionType(Long eventId, EventInteraction.InteractionType interactionType);

    List<EventInteraction> findTop100ByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT i.event.id, COUNT(i) FROM EventInteraction i WHERE i.interactionType = :interactionType GROUP BY i.event.id")
    List<Object[]> countByEventGrouped(EventInteraction.InteractionType interactionType);

    long countByUserIdAndEventIdAndInteractionTypeAndCreatedAtAfter(
            Long userId,
            Long eventId,
            EventInteraction.InteractionType interactionType,
            Instant since
    );

    @Modifying
    @Query("DELETE FROM EventInteraction i WHERE i.event.id = :eventId")
    void deleteByEventId(@Param("eventId") Long eventId);
}
