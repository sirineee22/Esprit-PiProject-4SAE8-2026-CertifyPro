package com.esprit.pi.jobcareers.repository;

import com.esprit.pi.jobcareers.model.Company;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {

    boolean existsByName(String name);

    @Query("SELECT c FROM Company c WHERE c.userId = :userId")
    Optional<Company> findByUserId(@Param("userId") Long userId);

    @Query("SELECT c FROM Company c WHERE " +
            "(:keyword IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%',:keyword,'%')) OR " +
            "LOWER(c.industryType) LIKE LOWER(CONCAT('%',:keyword,'%'))) " +
            "AND (:industryType IS NULL OR LOWER(c.industryType) = LOWER(:industryType))")
    Page<Company> searchCompanies(@Param("keyword") String keyword,
                                  @Param("industryType") String industryType,
                                  Pageable pageable);
}