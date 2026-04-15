package com.training.platform.repository;

import com.training.platform.entity.GroupMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupMembershipRepository extends JpaRepository<GroupMembership, Long> {
    List<GroupMembership> findByStudentId(Long studentId);

    List<GroupMembership> findByWorkgroupId(Long workgroupId);

    boolean existsByWorkgroupIdAndStudentId(Long workgroupId, Long studentId);
}
