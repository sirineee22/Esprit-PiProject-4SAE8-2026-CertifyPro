package com.esprit.pi.jobcareers.service;

import com.esprit.pi.jobcareers.client.UserClient;
import com.esprit.pi.jobcareers.dto.client.UserDTO;
import com.esprit.pi.jobcareers.dto.request.ApplyJobRequest;
import com.esprit.pi.jobcareers.dto.request.UpdateApplicationStatusRequest;
import com.esprit.pi.jobcareers.dto.response.JobApplicationResponse;
import com.esprit.pi.jobcareers.enums.ApplicationStatus;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JobApplicationServiceImplTest {

    @Mock private JobApplicationRepository applicationRepository;
    @Mock private JobOfferRepository       jobOfferRepository;
    @Mock private CandidateRepository      candidateRepository;
    @Mock private JobApplicationMapper     applicationMapper;
    @Mock private UserClient               userClient;

    @InjectMocks
    private JobApplicationServiceImpl service;

    private JobOffer     offer;
    private Candidate    candidate;
    private JobApplication app;
    private JobApplicationResponse response;

    @BeforeEach
    void setUp() {
        offer = new JobOffer();
        offer.setId(1L);

        candidate = new Candidate();
        candidate.setId(2L);
        candidate.setUserId(100L);

        app = new JobApplication();
        response = new JobApplicationResponse();
    }

    // ── applyForJob — success (candidate exists) ──────────────────────────────

    @Test
    void shouldApplySuccessfully_whenCandidateExists() {
        ApplyJobRequest request = new ApplyJobRequest();
        request.setJobOfferId(1L);

        when(jobOfferRepository.findById(1L)).thenReturn(Optional.of(offer));
        when(candidateRepository.findByUserId(100L)).thenReturn(Optional.of(candidate));
        when(applicationRepository.existsByJobOfferIdAndCandidateId(1L, 2L)).thenReturn(false);
        when(applicationRepository.save(any())).thenReturn(app);
        when(applicationMapper.toResponse(app)).thenReturn(response);

        JobApplicationResponse result = service.applyForJob(request, 100L);

        assertNotNull(result);
        verify(applicationRepository).save(any());
        verify(jobOfferRepository).save(offer);
    }

    // ── applyForJob — candidate created via Feign ─────────────────────────────

    @Test
    void shouldCreateCandidate_whenNotExists() {
        ApplyJobRequest request = new ApplyJobRequest();
        request.setJobOfferId(1L);

        UserDTO user = new UserDTO();
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setEmail("john@test.com");

        Candidate newCandidate = new Candidate();
        newCandidate.setId(2L);

        when(jobOfferRepository.findById(1L)).thenReturn(Optional.of(offer));
        when(candidateRepository.findByUserId(100L)).thenReturn(Optional.empty());
        when(userClient.getUserById(100L)).thenReturn(user);
        when(candidateRepository.save(any())).thenReturn(newCandidate);
        when(applicationRepository.existsByJobOfferIdAndCandidateId(anyLong(), anyLong())).thenReturn(false);
        when(applicationRepository.save(any())).thenReturn(app);
        when(applicationMapper.toResponse(app)).thenReturn(response);

        JobApplicationResponse result = service.applyForJob(request, 100L);

        assertNotNull(result);
        verify(userClient).getUserById(100L);
        verify(candidateRepository).save(any());
    }

    // ── applyForJob — job not found ───────────────────────────────────────────

    @Test
    void shouldThrow_whenJobNotFound() {
        ApplyJobRequest request = new ApplyJobRequest();
        request.setJobOfferId(99L);

        when(jobOfferRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.applyForJob(request, 100L));
        verify(applicationRepository, never()).save(any());
    }

    // ── applyForJob — duplicate ───────────────────────────────────────────────

    @Test
    void shouldThrow_whenAlreadyApplied() {
        ApplyJobRequest request = new ApplyJobRequest();
        request.setJobOfferId(1L);

        when(jobOfferRepository.findById(1L)).thenReturn(Optional.of(offer));
        when(candidateRepository.findByUserId(100L)).thenReturn(Optional.of(candidate));
        when(applicationRepository.existsByJobOfferIdAndCandidateId(1L, 2L)).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> service.applyForJob(request, 100L));
    }

    // ── applyForJob — user-service unavailable ────────────────────────────────

    @Test
    void shouldThrow_whenUserServiceUnavailable() {
        ApplyJobRequest request = new ApplyJobRequest();
        request.setJobOfferId(1L);

        when(jobOfferRepository.findById(1L)).thenReturn(Optional.of(offer));
        when(candidateRepository.findByUserId(100L)).thenReturn(Optional.empty());
        when(userClient.getUserById(100L)).thenThrow(mock(FeignException.class));

        assertThrows(RuntimeException.class, () -> service.applyForJob(request, 100L));
    }

    // ── getApplicationById ────────────────────────────────────────────────────

    @Test
    void shouldReturnApplicationById() {
        when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));
        when(applicationMapper.toResponse(app)).thenReturn(response);

        assertNotNull(service.getApplicationById(1L));
    }

    @Test
    void shouldThrow_whenApplicationNotFound() {
        when(applicationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.getApplicationById(99L));
    }

    // ── updateStatus ──────────────────────────────────────────────────────────

    @Test
    void shouldUpdateStatus_toInterview() {
        UpdateApplicationStatusRequest req = new UpdateApplicationStatusRequest();
        req.setStatus(ApplicationStatus.INTERVIEW);

        when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));
        when(applicationRepository.save(app)).thenReturn(app);
        when(applicationMapper.toResponse(app)).thenReturn(response);

        service.updateStatus(1L, req);

        assertEquals(ApplicationStatus.INTERVIEW, app.getStatus());
        verify(applicationRepository).save(app);
    }

    @Test
    void shouldUpdateStatus_toApproved() {
        UpdateApplicationStatusRequest req = new UpdateApplicationStatusRequest();
        req.setStatus(ApplicationStatus.APPROVED);

        when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));
        when(applicationRepository.save(app)).thenReturn(app);
        when(applicationMapper.toResponse(app)).thenReturn(response);

        service.updateStatus(1L, req);

        assertEquals(ApplicationStatus.APPROVED, app.getStatus());
    }

    // ── deleteApplication ─────────────────────────────────────────────────────

    @Test
    void shouldDeleteApplication() {
        when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));

        service.deleteApplication(1L);

        verify(applicationRepository).delete(app);
    }

    @Test
    void shouldThrow_whenDeletingNonExistentApplication() {
        when(applicationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.deleteApplication(99L));
    }

    // ── hasApplied ────────────────────────────────────────────────────────────

    @Test
    void shouldReturnTrue_whenAlreadyApplied() {
        when(candidateRepository.findByUserId(100L)).thenReturn(Optional.of(candidate));
        when(applicationRepository.existsByJobOfferIdAndCandidateId(1L, 2L)).thenReturn(true);

        assertTrue(service.hasApplied(1L, 100L));
    }

    @Test
    void shouldReturnFalse_whenCandidateDoesNotExist() {
        when(candidateRepository.findByUserId(100L)).thenReturn(Optional.empty());

        assertFalse(service.hasApplied(1L, 100L));
    }

    // ── withdrawApplication ───────────────────────────────────────────────────

    @Test
    void shouldWithdrawApplication_whenOwner() {
        app.setCandidate(candidate);

        when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));

        service.withdrawApplication(1L, 100L);

        verify(applicationRepository).delete(app);
    }

    @Test
    void shouldThrow_whenWithdrawingOtherUsersApplication() {
        Candidate other = new Candidate();
        other.setUserId(999L);
        app.setCandidate(other);

        when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));

        assertThrows(RuntimeException.class, () -> service.withdrawApplication(1L, 100L));
        verify(applicationRepository, never()).delete(any());
    }

    // ── getMyApplications ─────────────────────────────────────────────────────

    @Test
    void shouldReturnMyApplications() {
        Page<JobApplication> page = new PageImpl<>(java.util.List.of(app));
        Pageable pageable = PageRequest.of(0, 10);

        when(candidateRepository.findByUserId(100L)).thenReturn(Optional.of(candidate));
        when(applicationRepository.findByCandidateId(2L, pageable)).thenReturn(page);
        when(applicationMapper.toResponse(app)).thenReturn(response);

        Page<JobApplicationResponse> result = service.getMyApplications(100L, pageable);

        assertEquals(1, result.getTotalElements());
    }
}
