package com.esprit.pi.jobcareers.repository;

import com.esprit.pi.jobcareers.model.SavedJob;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SavedJobRepository extends JpaRepository<SavedJob, Long> {
    Page<SavedJob> findByUserId(Long userId, Pageable pageable);
    boolean existsByUserIdAndJobOfferId(Long userId, Long jobOfferId);
    Optional<SavedJob> findByUserIdAndJobOfferId(Long userId, Long jobOfferId);
    void deleteByUserIdAndJobOfferId(Long userId, Long jobOfferId);
}