package com.esprit.pi.jobcareers.service;

import com.esprit.pi.jobcareers.dto.request.CandidateProfileRequest;
import com.esprit.pi.jobcareers.dto.response.CandidateResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
public interface CandidateService {

    CandidateResponse createOrUpdateProfile(HttpServletRequest request,
                                            CandidateProfileRequest req);

    CandidateResponse getCandidateById(Long id);

    CandidateResponse getCandidateByUserId(Long userId);

    Page<CandidateResponse> getAllCandidates(Pageable pageable);

    Page<CandidateResponse> searchCandidates(String keyword, Pageable pageable);

    Page<CandidateResponse> getRecentCandidates(Pageable pageable);

    void deleteCandidate(Long id, Long userId);}