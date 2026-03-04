package com.training.platform.repository;

import com.training.platform.entity.Progression;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProgressionRepository extends JpaRepository<Progression, Long> {
    Optional<Progression> findByUserIdAndFormationId(Long userId, Long formationId);

    List<Progression> findByUserId(Long userId);
}
