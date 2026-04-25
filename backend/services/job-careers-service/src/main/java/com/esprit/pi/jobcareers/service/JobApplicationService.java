package com.esprit.pi.jobcareers.service;

import com.esprit.pi.jobcareers.dto.request.ApplyJobRequest;
import com.esprit.pi.jobcareers.dto.request.UpdateApplicationStatusRequest;
import com.esprit.pi.jobcareers.dto.response.JobApplicationResponse;
import com.esprit.pi.jobcareers.enums.ApplicationStatus;
import com.esprit.pi.jobcareers.enums.ContractType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface JobApplicationService {
    JobApplicationResponse applyForJob(ApplyJobRequest request, Long userId);
    JobApplicationResponse getApplicationById(Long id);
    JobApplicationResponse getApplicationByRef(String applicationId);
    Page<JobApplicationResponse> getAllApplications(Pageable pageable);
    Page<JobApplicationResponse> searchApplications(String keyword, ApplicationStatus status,
                                                     ContractType contractType, LocalDate applyDate,
                                                     Pageable pageable);
    Page<JobApplicationResponse> getMyApplications(Long userId, Pageable pageable);
    Page<JobApplicationResponse> getApplicationsByJobOffer(Long jobOfferId, Pageable pageable);
    JobApplicationResponse updateStatus(Long id, UpdateApplicationStatusRequest request);
    void deleteApplication(Long id);
    boolean hasApplied(Long jobOfferId, Long userId);
     void withdrawApplication(Long applicationId, Long userId) ;}
