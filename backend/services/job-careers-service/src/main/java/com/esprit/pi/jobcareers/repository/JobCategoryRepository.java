package com.esprit.pi.jobcareers.repository;

import com.esprit.pi.jobcareers.model.JobCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface JobCategoryRepository extends JpaRepository<JobCategory, Long> {
    boolean existsByName(String name);
    Optional<JobCategory> findByName(String name);
}