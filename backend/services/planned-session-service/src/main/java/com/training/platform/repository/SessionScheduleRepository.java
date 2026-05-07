package com.training.platform.repository;

import com.training.platform.entity.SessionSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SessionScheduleRepository extends JpaRepository<SessionSchedule, Long> {
    List<SessionSchedule> findByTrainerId(Long trainerId);

    List<SessionSchedule> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);

    boolean existsByRoomIdAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(Long roomId, LocalDateTime endTime,
            LocalDateTime startTime);

    boolean existsByTrainerIdAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(Long trainerId, LocalDateTime endTime,
            LocalDateTime startTime);
}
