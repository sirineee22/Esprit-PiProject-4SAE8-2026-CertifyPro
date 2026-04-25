package com.esprit.pi.jobcareers.repository;

import com.esprit.pi.jobcareers.enums.ContractType;
import com.esprit.pi.jobcareers.enums.JobStatus;
import com.esprit.pi.jobcareers.model.JobOffer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface JobOfferRepository extends JpaRepository<JobOffer, Long> {

    Page<JobOffer> findByCompanyId(Long companyId, Pageable pageable);

    Page<JobOffer> findByCategoryId(Long categoryId, Pageable pageable);

    Page<JobOffer> findByStatus(JobStatus status, Pageable pageable);


    List<JobOffer> findByPostedByUserId(Long userId);

    Page<JobOffer> findByPostedByUserId(Long userId, Pageable pageable);

    List<JobOffer> findByIsUrgentTrue();

    List<JobOffer> findByIsFeaturedTrue();

    @Query("SELECT j FROM JobOffer j WHERE " +
            "(:keyword IS NULL OR LOWER(j.title) LIKE LOWER(CONCAT('%', cast(:keyword as String), '%')) " +
            " OR LOWER(j.company.name) LIKE LOWER(CONCAT('%', cast(:keyword as String), '%'))) " +
            "AND (:contractType IS NULL OR j.contractType = :contractType) " +
            "AND (:categoryId IS NULL OR j.category.id = :categoryId) " +
            "AND (:postDate IS NULL OR j.postDate >= :postDate) " +
            "AND (:country IS NULL OR LOWER(j.country) LIKE LOWER(CONCAT('%', cast(:country as String), '%')))")
    Page<JobOffer> searchOffers(
            @Param("keyword") String keyword,
            @Param("contractType") ContractType contractType,
            @Param("categoryId") Long categoryId,
            @Param("postDate") LocalDate postDate,
            @Param("country") String country,
            Pageable pageable);

    @Query("SELECT j FROM JobOffer j ORDER BY j.applicationCount DESC")
    List<JobOffer> findTopByApplicationCount(Pageable pageable);


    List<JobOffer> findByStatus(JobStatus jobStatus);

}