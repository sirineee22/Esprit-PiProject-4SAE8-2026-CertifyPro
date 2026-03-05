package com.training.events.repository;

import com.training.events.entity.Event;
import com.training.events.entity.EventRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EventRegistrationRepository extends JpaRepository<EventRegistration, Long> {

    Optional<EventRegistration> findByEventAndLearnerId(Event event, Long learnerId);

    boolean existsByEventAndLearnerIdAndStatus(Event event, Long learnerId, EventRegistration.RegistrationStatus status);

    List<EventRegistration> findByEventAndStatus(Event event, EventRegistration.RegistrationStatus status);

    @Query("SELECT r FROM EventRegistration r JOIN FETCH r.event WHERE r.learnerId = :learnerId AND r.status = :status ORDER BY r.registeredAt DESC")
    List<EventRegistration> findByLearnerIdAndStatusOrderByRegisteredAtDesc(
            @Param("learnerId") Long learnerId,
            @Param("status") EventRegistration.RegistrationStatus status);

    @Query("SELECT r FROM EventRegistration r JOIN FETCH r.event WHERE r.learnerId = :learnerId AND r.status IN :statuses")
    List<EventRegistration> findByLearnerIdAndStatusIn(@Param("learnerId") Long learnerId, @Param("statuses") List<EventRegistration.RegistrationStatus> statuses);

    Optional<EventRegistration> findFirstByEventAndStatusOrderByRegisteredAtAsc(Event event, EventRegistration.RegistrationStatus status);

    boolean existsByEventIdAndLearnerId(Long eventId, Long learnerId);

    long countByStatus(EventRegistration.RegistrationStatus status);

    @Modifying
    @Query("DELETE FROM EventRegistration r WHERE r.event.id = :eventId")
    void deleteByEventId(@Param("eventId") Long eventId);

    /** Returns [eventId, count] for REGISTERED registrations per event. */
    @Query("SELECT r.event.id, COUNT(r) FROM EventRegistration r WHERE r.status = 'REGISTERED' GROUP BY r.event.id")
    List<Object[]> countRegisteredByEventId();
}
