package com.esprit.pi.jobcareers.service;

import com.esprit.pi.jobcareers.client.UserClient;
import com.esprit.pi.jobcareers.dto.client.UserDTO;
import com.esprit.pi.jobcareers.dto.request.CandidateProfileRequest;
import com.esprit.pi.jobcareers.dto.response.CandidateResponse;
import com.esprit.pi.jobcareers.exception.ResourceNotFoundException;
import com.esprit.pi.jobcareers.mapper.CandidateMapper;
import com.esprit.pi.jobcareers.model.Candidate;
import com.esprit.pi.jobcareers.repository.CandidateRepository;
import feign.FeignException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CandidateServiceImpl implements CandidateService {

    private final CandidateRepository candidateRepository;
    private final CandidateMapper candidateMapper;
    private final UserClient userClient;

    @Override
    public CandidateResponse createOrUpdateProfile(HttpServletRequest httpRequest,
                                                   CandidateProfileRequest request) {

        // ✅ 1. get userId from JWT
        Long userId = SecurityUtils.getCurrentUserId(httpRequest);

        if (userId == null) {
            throw new RuntimeException("Unauthorized: userId missing");
        }

        // 🔥 2. verify user exists via Feign — with proper error handling
        UserDTO user;
        try {
            user = userClient.getUserById(userId);
        } catch (FeignException.NotFound e) {
            throw new ResourceNotFoundException("User introuvable avec id: " + userId);
        } catch (FeignException e) {
            log.error("user-service unavailable for userId={}", userId, e);
            throw new RuntimeException("user-service unavailable, try again later");
        }

        // ✅ explicit null check
        if (user == null) {
            throw new ResourceNotFoundException("User introuvable avec id: " + userId);
        }

        // 🔥 3. check if candidate exists
        Candidate candidate = candidateRepository.findByUserId(userId).orElse(null);

        if (candidate == null) {
            candidate = candidateMapper.toEntity(request);
            candidate.setUserId(userId);
            candidate.setCreatedAt(LocalDateTime.now());

            log.info("Création candidat userId={}", userId);

        } else {
            candidateMapper.updateFromRequest(request, candidate);
            log.info("Update candidat userId={}", userId);
        }

        Candidate saved = candidateRepository.save(candidate);

        return candidateMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CandidateResponse getCandidateById(Long id) {

        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidat", id));

        return candidateMapper.toResponse(candidate);
    }

    @Override
    @Transactional(readOnly = true)
    public CandidateResponse getCandidateByUserId(Long userId) {

        Candidate candidate = candidateRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Candidat introuvable pour userId = " + userId
                ));

        return candidateMapper.toResponse(candidate);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CandidateResponse> getAllCandidates(Pageable pageable) {
        return candidateRepository.findAll(pageable)
                .map(candidateMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CandidateResponse> searchCandidates(String keyword, Pageable pageable) {
        return candidateRepository.searchCandidates(keyword, pageable)
                .map(candidateMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CandidateResponse> getRecentCandidates(Pageable pageable) {

        LocalDateTime since = LocalDateTime.now().minusHours(24);

        return candidateRepository.findRecentCandidates(since, pageable)
                .map(candidateMapper::toResponse);
    }

    @Override
    public void deleteCandidate(Long id, Long userId) {

        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidat", id));

        if (!candidate.getUserId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        candidateRepository.delete(candidate);
    }

}