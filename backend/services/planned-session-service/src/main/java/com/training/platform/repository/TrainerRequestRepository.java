package com.training.platform.repository;

import com.training.platform.entity.TrainerRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrainerRequestRepository extends JpaRepository<TrainerRequest, Long> {

    List<TrainerRequest> findByStatus(TrainerRequest.RequestStatus status);

    List<TrainerRequest> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<TrainerRequest> findFirstByUserIdAndStatusOrderByCreatedAtDesc(Long userId,
            TrainerRequest.RequestStatus status);

    boolean existsByUserIdAndStatus(Long userId, TrainerRequest.RequestStatus status);
}
