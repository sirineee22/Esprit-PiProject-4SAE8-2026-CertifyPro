package com.training.platform.repository;

import com.training.platform.entity.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {
    boolean existsByUserIdAndBadgeKey(Long userId, String badgeKey);
    List<UserBadge> findByUserIdOrderByEarnedAtDesc(Long userId);
}
