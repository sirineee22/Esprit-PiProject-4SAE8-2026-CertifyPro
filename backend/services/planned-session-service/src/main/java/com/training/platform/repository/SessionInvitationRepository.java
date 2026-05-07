package com.training.platform.repository;

import com.training.platform.entity.SessionInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SessionInvitationRepository extends JpaRepository<SessionInvitation, Long> {
    List<SessionInvitation> findBySessionScheduleId(Long sessionId);

    List<SessionInvitation> findByStudentId(Long studentId);
}
