package com.training.platform.repository;

import com.training.platform.entity.TrainerRequest;
import com.training.platform.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrainerRequestRepository extends JpaRepository<TrainerRequest, Long> {
    
    List<TrainerRequest> findByStatus(TrainerRequest.RequestStatus status);
    
    List<TrainerRequest> findByUserOrderByCreatedAtDesc(User user);
    
    Optional<TrainerRequest> findFirstByUserAndStatusOrderByCreatedAtDesc(User user, TrainerRequest.RequestStatus status);
    
    boolean existsByUserAndStatus(User user, TrainerRequest.RequestStatus status);
}
