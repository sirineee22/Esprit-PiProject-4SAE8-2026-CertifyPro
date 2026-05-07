package com.training.platform.repository;

import com.training.platform.entity.GroupMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupMessageRepository extends JpaRepository<GroupMessage, Long> {
    List<GroupMessage> findByWorkgroupIdOrderByCreatedAtDesc(Long workgroupId);

    List<GroupMessage> findByWorkgroupIdAndPinnedTrueOrderByCreatedAtDesc(Long workgroupId);
}
