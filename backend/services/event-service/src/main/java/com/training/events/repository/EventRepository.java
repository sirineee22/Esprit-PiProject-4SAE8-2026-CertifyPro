package com.training.events.repository;

import com.training.events.entity.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findByTrainerIdOrderByDateStartDesc(Long trainerId);

    List<Event> findByStatus(Event.EventStatus status);

    Page<Event> findByStatusAndDateStartAfter(Event.EventStatus status, Instant after, Pageable pageable);

    long countByStatus(Event.EventStatus status);

    long countByType(Event.EventType type);

    long countByMode(Event.EventMode mode);
}
