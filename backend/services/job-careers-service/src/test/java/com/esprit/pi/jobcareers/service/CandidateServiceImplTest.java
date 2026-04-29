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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CandidateServiceImplTest {

    @Mock
    private CandidateRepository candidateRepository;

    @Mock
    private CandidateMapper candidateMapper;

    @Mock
    private UserClient userClient;

    @Mock
    private HttpServletRequest httpRequest;

    @InjectMocks
    private CandidateServiceImpl candidateService;

    // ✅ TEST 1: CREATE PROFILE SUCCESS
    @Test
    void shouldCreateProfileSuccessfully() {

        Long userId = 1L;

        CandidateProfileRequest request = new CandidateProfileRequest();
        Candidate candidate = new Candidate();
        CandidateResponse response = new CandidateResponse();
        UserDTO user = new UserDTO();

        // ⚠️ mock static SecurityUtils
        try (MockedStatic<SecurityUtils> mocked = mockStatic(SecurityUtils.class)) {

            mocked.when(() -> SecurityUtils.getCurrentUserId(httpRequest))
                    .thenReturn(userId);

            when(userClient.getUserById(userId)).thenReturn(user);
            when(candidateRepository.findByUserId(userId)).thenReturn(Optional.empty());
            when(candidateMapper.toEntity(request)).thenReturn(candidate);
            when(candidateRepository.save(candidate)).thenReturn(candidate);
            when(candidateMapper.toResponse(candidate)).thenReturn(response);

            CandidateResponse result =
                    candidateService.createOrUpdateProfile(httpRequest, request);

            assertNotNull(result);
            verify(candidateRepository).save(candidate);
        }
    }

    // ❌ TEST 2: USER NOT FOUND (FeignException)
    @Test
    void shouldThrowException_whenUserNotFound() {

        Long userId = 5L;
        CandidateProfileRequest request = new CandidateProfileRequest();

        try (MockedStatic<SecurityUtils> mocked = mockStatic(SecurityUtils.class)) {

            mocked.when(() -> SecurityUtils.getCurrentUserId(httpRequest))
                    .thenReturn(userId);

            when(userClient.getUserById(userId))
                    .thenThrow(mock(FeignException.NotFound.class));

            assertThrows(ResourceNotFoundException.class, () ->
                    candidateService.createOrUpdateProfile(httpRequest, request)
            );
        }
    }

    // ❌ TEST 3: USER ID NULL
    @Test
    void shouldThrowException_whenUserIdMissing() {

        try (MockedStatic<SecurityUtils> mocked = mockStatic(SecurityUtils.class)) {

            mocked.when(() -> SecurityUtils.getCurrentUserId(httpRequest))
                    .thenReturn(null);

            assertThrows(RuntimeException.class, () ->
                    candidateService.createOrUpdateProfile(httpRequest, new CandidateProfileRequest())
            );
        }
    }

    // ✅ TEST 4: GET BY USER ID SUCCESS
    @Test
    void shouldReturnCandidate_whenUserIdExists() {

        Long userId = 1L;
        Candidate candidate = new Candidate();
        CandidateResponse response = new CandidateResponse();

        when(candidateRepository.findByUserId(userId))
                .thenReturn(Optional.of(candidate));
        when(candidateMapper.toResponse(candidate))
                .thenReturn(response);

        CandidateResponse result = candidateService.getCandidateByUserId(userId);

        assertNotNull(result);
    }

    // ❌ TEST 5: NOT FOUND
    @Test
    void shouldThrowException_whenCandidateNotFound() {

        when(candidateRepository.findByUserId(10L))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                candidateService.getCandidateByUserId(10L)
        );
    }

    // ✅ TEST 6: DELETE SUCCESS
    @Test
    void shouldDeleteCandidate_whenAuthorized() {

        Long id = 1L;
        Long userId = 1L;

        Candidate candidate = new Candidate();
        candidate.setUserId(userId);

        when(candidateRepository.findById(id))
                .thenReturn(Optional.of(candidate));

        candidateService.deleteCandidate(id, userId);

        verify(candidateRepository).delete(candidate);
    }

    // ❌ TEST 7: DELETE UNAUTHORIZED
    @Test
    void shouldThrowException_whenDeleteUnauthorized() {

        Candidate candidate = new Candidate();
        candidate.setUserId(2L);

        when(candidateRepository.findById(1L))
                .thenReturn(Optional.of(candidate));

        assertThrows(RuntimeException.class, () ->
                candidateService.deleteCandidate(1L, 1L)
        );
    }
}