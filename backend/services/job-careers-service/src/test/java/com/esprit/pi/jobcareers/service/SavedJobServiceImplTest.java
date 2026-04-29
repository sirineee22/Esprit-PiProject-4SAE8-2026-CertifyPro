package com.esprit.pi.jobcareers.service;

import com.esprit.pi.jobcareers.dto.response.JobOfferResponse;
import com.esprit.pi.jobcareers.exception.DuplicateResourceException;
import com.esprit.pi.jobcareers.exception.ResourceNotFoundException;
import com.esprit.pi.jobcareers.mapper.JobMapper;
import com.esprit.pi.jobcareers.model.JobOffer;
import com.esprit.pi.jobcareers.model.SavedJob;
import com.esprit.pi.jobcareers.repository.JobOfferRepository;
import com.esprit.pi.jobcareers.repository.SavedJobRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SavedJobServiceImplTest {

    @Mock
    private SavedJobRepository savedJobRepository;

    @Mock
    private JobOfferRepository jobOfferRepository;

    @Mock
    private JobMapper jobMapper;

    @InjectMocks
    private SavedJobServiceImpl savedJobService;

    // ✅ SAVE SUCCESS
    @Test
    void shouldSaveJobSuccessfully() {

        JobOffer offer = new JobOffer();

        when(savedJobRepository.existsByUserIdAndJobOfferId(1L, 1L))
                .thenReturn(false);

        when(jobOfferRepository.findById(1L))
                .thenReturn(Optional.of(offer));

        savedJobService.saveJob(1L, 1L);

        verify(savedJobRepository).save(any(SavedJob.class));
    }

    // ❌ DUPLICATE
    @Test
    void shouldThrow_whenAlreadySaved() {

        when(savedJobRepository.existsByUserIdAndJobOfferId(1L, 1L))
                .thenReturn(true);

        assertThrows(DuplicateResourceException.class, () ->
                savedJobService.saveJob(1L, 1L)
        );
    }

    // ❌ JOB NOT FOUND
    @Test
    void shouldThrow_whenJobNotFound() {

        when(savedJobRepository.existsByUserIdAndJobOfferId(1L, 1L))
                .thenReturn(false);

        when(jobOfferRepository.findById(1L))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                savedJobService.saveJob(1L, 1L)
        );
    }

    // ❌ UNSAVE NOT FOUND
    @Test
    void shouldThrow_whenUnsaveNotFound() {

        when(savedJobRepository.findByUserIdAndJobOfferId(1L, 1L))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                savedJobService.unsaveJob(1L, 1L)
        );
    }

    // ✅ GET SAVED JOBS
    @Test
    void shouldReturnSavedJobs() {

        JobOffer offer = new JobOffer();
        SavedJob saved = SavedJob.builder()
                .jobOffer(offer)
                .build();

        Page<SavedJob> page = new PageImpl<>(java.util.List.of(saved));

        when(savedJobRepository.findByUserId(eq(1L), any(Pageable.class)))
                .thenReturn(page);

        when(jobMapper.toResponse(offer))
                .thenReturn(new JobOfferResponse());

        Page<JobOfferResponse> result =
                savedJobService.getSavedJobs(1L, PageRequest.of(0, 10));

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }
}