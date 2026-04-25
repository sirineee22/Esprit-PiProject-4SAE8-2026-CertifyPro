package com.esprit.pi.jobcareers.repository;

import com.esprit.pi.jobcareers.enums.ApplicationStatus;
import com.esprit.pi.jobcareers.enums.ContractType;
import com.esprit.pi.jobcareers.model.JobApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {

    Optional<JobApplication> findByApplicationId(String applicationId);

    // ── findByCandidateId with eager fetch ──────────────────────────────────
    @Query(value = "SELECT ja FROM JobApplication ja "
                 + "LEFT JOIN FETCH ja.candidate "
                 + "LEFT JOIN FETCH ja.jobOffer jo "
                 + "LEFT JOIN FETCH jo.company "
                 + "WHERE ja.candidate.id = :candidateId",
           countQuery = "SELECT COUNT(ja) FROM JobApplication ja WHERE ja.candidate.id = :candidateId")
    Page<JobApplication> findByCandidateId(@Param("candidateId") Long candidateId, Pageable pageable);

    // ── findByJobOfferId with eager fetch ───────────────────────────────────
    @Query(value = "SELECT ja FROM JobApplication ja "
                 + "LEFT JOIN FETCH ja.candidate "
                 + "LEFT JOIN FETCH ja.jobOffer jo "
                 + "LEFT JOIN FETCH jo.company "
                 + "WHERE ja.jobOffer.id = :jobOfferId",
           countQuery = "SELECT COUNT(ja) FROM JobApplication ja WHERE ja.jobOffer.id = :jobOfferId")
    Page<JobApplication> findByJobOfferId(@Param("jobOfferId") Long jobOfferId, Pageable pageable);

    // ── findAll with eager fetch ────────────────────────────────────────────
    @Query(value = "SELECT ja FROM JobApplication ja "
                 + "LEFT JOIN FETCH ja.candidate "
                 + "LEFT JOIN FETCH ja.jobOffer jo "
                 + "LEFT JOIN FETCH jo.company",
           countQuery = "SELECT COUNT(ja) FROM JobApplication ja")
    Page<JobApplication> findAllWithRelations(Pageable pageable);

    Page<JobApplication> findByStatus(ApplicationStatus status, Pageable pageable);

    boolean existsByJobOfferIdAndCandidateId(Long jobOfferId, Long candidateId);

    // ── searchApplications with eager fetch ────────────────────────────────
    // Note: keyword null check done in service before calling this method
    @Query(value = "SELECT ja FROM JobApplication ja "
                 + "LEFT JOIN FETCH ja.candidate "
                 + "LEFT JOIN FETCH ja.jobOffer jo "
                 + "LEFT JOIN FETCH jo.company "
                 + "WHERE (COALESCE(:keyword, '') = '' "
                 + "       OR LOWER(ja.companyName) LIKE LOWER(CONCAT('%', :keyword, '%')) "
                 + "       OR LOWER(ja.designation) LIKE LOWER(CONCAT('%', :keyword, '%'))) "
                 + "  AND (:status IS NULL OR ja.status = :status) "
                 + "  AND (:contractType IS NULL OR ja.contractType = :contractType) "
                 + "  AND (:applyDate IS NULL OR ja.applyDate = :applyDate)",
           countQuery = "SELECT COUNT(ja) FROM JobApplication ja "
                 + "WHERE (COALESCE(:keyword, '') = '' "
                 + "       OR LOWER(ja.companyName) LIKE LOWER(CONCAT('%', :keyword, '%')) "
                 + "       OR LOWER(ja.designation) LIKE LOWER(CONCAT('%', :keyword, '%'))) "
                 + "  AND (:status IS NULL OR ja.status = :status) "
                 + "  AND (:contractType IS NULL OR ja.contractType = :contractType) "
                 + "  AND (:applyDate IS NULL OR ja.applyDate = :applyDate)")
    Page<JobApplication> searchApplications(
            @Param("keyword") String keyword,
            @Param("status") ApplicationStatus status,
            @Param("contractType") ContractType contractType,
            @Param("applyDate") LocalDate applyDate,
            Pageable pageable
    );

    Long countByStatus(ApplicationStatus status);

    @Query("SELECT COUNT(a) FROM JobApplication a WHERE "
         + "MONTH(a.createdAt) = :month AND YEAR(a.createdAt) = :year")
    Long countByMonthAndYear(@Param("month") int month, @Param("year") int year);
}
