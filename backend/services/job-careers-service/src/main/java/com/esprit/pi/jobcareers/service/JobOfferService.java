package com.esprit.pi.jobcareers.service;

import com.esprit.pi.jobcareers.dto.request.CreateJobOfferRequest;
import com.esprit.pi.jobcareers.dto.request.UpdateJobOfferRequest;
import com.esprit.pi.jobcareers.dto.response.JobOfferResponse;
import com.esprit.pi.jobcareers.enums.ContractType;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface JobOfferService {
    JobOfferResponse createJobOffer(CreateJobOfferRequest request, HttpServletRequest httpRequest);

    /** Ancienne signature (tests, appels internes) — préférer la surcharge avec {@link HttpServletRequest}. */
    JobOfferResponse createJobOffer(CreateJobOfferRequest request, Long userId);
    JobOfferResponse getJobOfferById(Long id);
    Page<JobOfferResponse> getAllJobOffers(Pageable pageable);
    Page<JobOfferResponse> searchJobOffers(String keyword, ContractType contractType,
                                            Long categoryId, LocalDate postDate,
                                            String country, Pageable pageable);
    Page<JobOfferResponse> getJobOffersByCompany(Long companyId, Pageable pageable);
    Page<JobOfferResponse> getJobOffersByCategory(Long categoryId, Pageable pageable);

    Page<JobOfferResponse> getMyPostedOffersPage(Long userId, Pageable pageable);

    JobOfferResponse updateJobOffer(Long id, UpdateJobOfferRequest request, Long userId);
    void deleteJobOffer(Long id);
    List<JobOfferResponse> getUrgentOffers();
    List<JobOfferResponse> getFeaturedOffers();
    List<JobOfferResponse> getMyPostedOffers(Long userId);
    List<JobOfferResponse> getTopOffers(int limit);
    Page<JobOfferResponse> getMyPostedOffersPaged(Long userId, int page, int size);
}