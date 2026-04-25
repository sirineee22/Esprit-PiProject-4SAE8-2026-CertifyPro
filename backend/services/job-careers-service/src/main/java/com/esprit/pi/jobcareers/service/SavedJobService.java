package com.esprit.pi.jobcareers.service;

import com.esprit.pi.jobcareers.dto.response.JobOfferResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface SavedJobService {
    void saveJob(Long jobOfferId, Long userId);
    void unsaveJob(Long jobOfferId, Long userId);
    boolean isSaved(Long jobOfferId, Long userId);
    Page<JobOfferResponse> getSavedJobs(Long userId, Pageable pageable);
}