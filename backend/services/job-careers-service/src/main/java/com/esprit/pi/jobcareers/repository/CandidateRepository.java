package com.esprit.pi.jobcareers.repository;

import com.esprit.pi.jobcareers.model.Candidate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, Long> {
    Optional<Candidate> findByUserId(Long userId);
    @Query("SELECT c FROM Candidate c WHERE :keyword IS NULL OR " +
           "LOWER(c.firstName) LIKE LOWER(CONCAT('%',:keyword,'%')) OR " +
           "LOWER(c.lastName) LIKE LOWER(CONCAT('%',:keyword,'%')) OR " +
           "LOWER(c.jobTitle) LIKE LOWER(CONCAT('%',:keyword,'%'))")
    Page<Candidate> searchCandidates(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT c FROM Candidate c WHERE c.createdAt >= :since")
    Page<Candidate> findRecentCandidates(
            LocalDateTime since, Pageable pageable);}