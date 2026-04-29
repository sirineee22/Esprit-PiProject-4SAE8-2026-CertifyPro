package com.esprit.pi.jobcareers.service;

import com.esprit.pi.jobcareers.client.UserClient;
import com.esprit.pi.jobcareers.dto.client.UserDTO;
import com.esprit.pi.jobcareers.dto.request.ApplyJobRequest;
import com.esprit.pi.jobcareers.dto.request.UpdateApplicationStatusRequest;
import com.esprit.pi.jobcareers.dto.response.JobApplicationResponse;
import com.esprit.pi.jobcareers.enums.ApplicationStatus;
import com.esprit.pi.jobcareers.enums.ContractType;
import com.esprit.pi.jobcareers.exception.DuplicateResourceException;
import com.esprit.pi.jobcareers.exception.ResourceNotFoundException;
import com.esprit.pi.jobcareers.mapper.JobApplicationMapper;
import com.esprit.pi.jobcareers.model.Candidate;
import com.esprit.pi.jobcareers.model.JobApplication;
import com.esprit.pi.jobcareers.model.JobOffer;
import com.esprit.pi.jobcareers.repository.CandidateRepository;
import com.esprit.pi.jobcareers.repository.JobApplicationRepository;
import com.esprit.pi.jobcareers.repository.JobOfferRepository;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class JobApplicationServiceImpl implements JobApplicationService {

    private final JobApplicationRepository applicationRepository;
    private final JobOfferRepository jobOfferRepository;
    private final CandidateRepository candidateRepository;
    private final JobApplicationMapper applicationMapper;
    private final UserClient userClient;

    // 🔥 helper method — get or create candidate safely
    private Candidate getOrCreateCandidate(Long userId) {

        return candidateRepository.findByUserId(userId)
                .orElseGet(() -> {
                    log.info("Creating candidate for userId={}", userId);

                    UserDTO user;
                    try {
                        user = userClient.getUserById(userId);
                    } catch (FeignException.NotFound e) {
                        throw new ResourceNotFoundException("User introuvable id=" + userId);
                    } catch (FeignException e) {
                        log.error("user-service unavailable for userId={}", userId, e);
                        throw new RuntimeException("user-service unavailable, try again later");
                    }

                    // ✅ explicit null check
                    if (user == null) {
                        throw new ResourceNotFoundException("User introuvable id=" + userId);
                    }

                    Candidate candidate = Candidate.builder()
                            .userId(userId)
                            .firstName(user.getFirstName())
                            .lastName(user.getLastName())
                            .email(user.getEmail())
                            .phone(user.getPhoneNumber())
                            .build();

                    return candidateRepository.save(candidate);
                });
    }

    @Override
    public JobApplicationResponse applyForJob(ApplyJobRequest request, Long userId) {

        JobOffer offer = jobOfferRepository.findById(request.getJobOfferId())
                .orElseThrow(() -> new ResourceNotFoundException("Offre", request.getJobOfferId()));

        Candidate candidate = getOrCreateCandidate(userId);

        boolean alreadyApplied =
                applicationRepository.existsByJobOfferIdAndCandidateId(
                        offer.getId(),
                        candidate.getId()
                );

        if (alreadyApplied) {
            throw new DuplicateResourceException("Vous avez déjà postulé à cette offre.");
        }

        JobApplication application = JobApplication.builder()
                .jobOffer(offer)
                .candidate(candidate)
                .companyName(
                        offer.getCompany() != null ? offer.getCompany().getName() : null
                )
                .designation(offer.getTitle())
                .contacts(candidate.getPhone())
                .contractType(offer.getContractType())
                .status(ApplicationStatus.NEW)
                .coverLetter(request.getCoverLetter())
                .resumeUrl(
                        request.getResumeUrl() != null
                                ? request.getResumeUrl()
                                : candidate.getResumeUrl()
                )
                .applyDate(LocalDate.now())
                .build();

        JobApplication saved = applicationRepository.save(application);

        // 🔥 safe increment
        offer.setApplicationCount(
                offer.getApplicationCount() == null ? 1 : offer.getApplicationCount() + 1
        );

        jobOfferRepository.save(offer);

        log.info("Application {} created for userId={}", saved.getApplicationId(), userId);

        return applicationMapper.toResponse(saved);
    }

    @Override
    public JobApplicationResponse getApplicationById(Long id) {
        return applicationRepository.findById(id)
                .map(applicationMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Candidature", id));
    }

    @Override
    public JobApplicationResponse getApplicationByRef(String applicationId) {
        return applicationRepository.findByApplicationId(applicationId)
                .map(applicationMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Candidature introuvable : " + applicationId
                ));
    }

    @Override
    public Page<JobApplicationResponse> getAllApplications(Pageable pageable) {
        return applicationRepository.findAllWithRelations(pageable)
                .map(applicationMapper::toResponse);
    }

    @Override
    public Page<JobApplicationResponse> searchApplications(
            String keyword,
            ApplicationStatus status,
            ContractType contractType,
            LocalDate applyDate,
            Pageable pageable
    ) {
        return applicationRepository
                .searchApplications(keyword, status, contractType, applyDate, pageable)
                .map(applicationMapper::toResponse);
    }

    @Override
    public Page<JobApplicationResponse> getMyApplications(Long userId, Pageable pageable) {

        Candidate candidate = getOrCreateCandidate(userId);

        return applicationRepository
                .findByCandidateId(candidate.getId(), pageable)
                .map(applicationMapper::toResponse);
    }

    @Override
    public Page<JobApplicationResponse> getApplicationsByJobOffer(Long jobOfferId, Pageable pageable) {

        if (!jobOfferRepository.existsById(jobOfferId)) {
            throw new ResourceNotFoundException("Offre", jobOfferId);
        }

        return applicationRepository.findByJobOfferId(jobOfferId, pageable)
                .map(applicationMapper::toResponse);
    }

    @Override
    public JobApplicationResponse updateStatus(Long id, UpdateApplicationStatusRequest request) {

        JobApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidature", id));

        application.setStatus(request.getStatus());

        if (request.getRecruiterNotes() != null) {
            application.setRecruiterNotes(request.getRecruiterNotes());
        }
        if (request.getInterviewDate() != null) {
            application.setInterviewDate(request.getInterviewDate());
        }
        if (request.getInterviewLink() != null) {
            application.setInterviewLink(request.getInterviewLink());
        }
        if (request.getInterviewNotes() != null) {
            application.setInterviewNotes(request.getInterviewNotes());
        }

        log.info("Status updated for application {} -> {}", id, request.getStatus());

        return applicationMapper.toResponse(applicationRepository.save(application));
    }

    @Override
    public void deleteApplication(Long id) {

        JobApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidature", id));

        applicationRepository.delete(application);

        log.info("Application deleted id={}", id);
    }

    @Override
    public boolean hasApplied(Long jobOfferId, Long userId) {

        return candidateRepository.findByUserId(userId)
                .map(c -> applicationRepository
                        .existsByJobOfferIdAndCandidateId(jobOfferId, c.getId()))
                .orElse(false);
    }
    @Override
    public void withdrawApplication(Long applicationId, Long userId) {
        JobApplication app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Candidature non trouvée"));

        // Vérifie que la candidature appartient bien à l'utilisateur connecté
        if (!app.getCandidate().getUserId().equals(userId)) {
            throw new RuntimeException("Vous ne pouvez retirer que vos propres candidatures");
        }

        // Supprime complètement la candidature
        applicationRepository.delete(app);
    }
}