package com.esprit.pi.jobcareers.repository;

import com.esprit.pi.jobcareers.model.JobAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobAlertRepository extends JpaRepository<JobAlert, Long> {
    List<JobAlert> findByUserId(Long userId);
    Optional<JobAlert> findByIdAndUserId(Long id, Long userId);
}
