package com.esprit.pi.jobcareers.service;

import com.esprit.pi.jobcareers.dto.response.JobOfferResponse;
import com.esprit.pi.jobcareers.exception.DuplicateResourceException;
import com.esprit.pi.jobcareers.exception.ResourceNotFoundException;
import com.esprit.pi.jobcareers.mapper.JobMapper;
import com.esprit.pi.jobcareers.model.JobOffer;
import com.esprit.pi.jobcareers.model.SavedJob;
import com.esprit.pi.jobcareers.repository.JobOfferRepository;
import com.esprit.pi.jobcareers.repository.SavedJobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SavedJobServiceImpl implements SavedJobService {

    private final SavedJobRepository savedJobRepository;
    private final JobOfferRepository jobOfferRepository;
    private final JobMapper jobMapper;

    @Override
    public void saveJob(Long jobOfferId, Long userId) {

        if (savedJobRepository.existsByUserIdAndJobOfferId(userId, jobOfferId)) {
            throw new DuplicateResourceException("Offre déjà sauvegardée");
        }

        JobOffer offer = jobOfferRepository.findById(jobOfferId)
                .orElseThrow(() -> new ResourceNotFoundException("Offre", jobOfferId));

        SavedJob savedJob = SavedJob.builder()
                .userId(userId)
                .jobOffer(offer)
                .build();

        savedJobRepository.save(savedJob);

        log.info("Job {} saved by user {}", jobOfferId, userId);
    }

    @Override
    public void unsaveJob(Long jobOfferId, Long userId) {

        SavedJob savedJob = savedJobRepository
                .findByUserIdAndJobOfferId(userId, jobOfferId)
                .orElseThrow(() -> new ResourceNotFoundException("Saved job not found"));

        savedJobRepository.delete(savedJob);

        log.info("Job {} unsaved by user {}", jobOfferId, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isSaved(Long jobOfferId, Long userId) {
        return savedJobRepository.existsByUserIdAndJobOfferId(userId, jobOfferId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<JobOfferResponse> getSavedJobs(Long userId, Pageable pageable) {
        return savedJobRepository.findByUserId(userId, pageable)
                .map(s -> jobMapper.toResponse(s.getJobOffer()));
    }
}