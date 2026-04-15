package com.training.platform.repository;

import com.training.platform.entity.XpEventLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface XpEventLogRepository extends JpaRepository<XpEventLog, Long> {
    boolean existsByUserIdAndActionAndEventId(Long userId, String action, Long eventId);
    long countByUserIdAndAction(Long userId, String action);
}
