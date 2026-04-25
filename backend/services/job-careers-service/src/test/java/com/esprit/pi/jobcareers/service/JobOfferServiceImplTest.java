package com.esprit.pi.jobcareers.service;

import com.esprit.pi.jobcareers.dto.request.CreateJobOfferRequest;
import com.esprit.pi.jobcareers.dto.request.UpdateJobOfferRequest;
import com.esprit.pi.jobcareers.dto.response.JobOfferResponse;
import com.esprit.pi.jobcareers.enums.JobStatus;
import com.esprit.pi.jobcareers.exception.JobException;
import com.esprit.pi.jobcareers.exception.ResourceNotFoundException;
import com.esprit.pi.jobcareers.mapper.JobMapper;
import com.esprit.pi.jobcareers.model.Company;
import com.esprit.pi.jobcareers.model.JobCategory;
import com.esprit.pi.jobcareers.model.JobOffer;
import com.esprit.pi.jobcareers.repository.CompanyRepository;
import com.esprit.pi.jobcareers.repository.JobCategoryRepository;
import com.esprit.pi.jobcareers.repository.JobOfferRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JobOfferServiceImplTest {

    @Mock
    private JobOfferRepository jobOfferRepository;
    @Mock
    private CompanyRepository companyRepository;
    @Mock
    private JobCategoryRepository categoryRepository;
    @Mock
    private JobMapper jobMapper;

    @InjectMocks
    private JobOfferServiceImpl jobOfferService;

    private CreateJobOfferRequest createRequest;
    private UpdateJobOfferRequest updateRequest;
    private JobOffer jobOffer;
    private JobOfferResponse jobOfferResponse;
    private Company company;
    private JobCategory category;

    @BeforeEach
    void setUp() {
        createRequest = new CreateJobOfferRequest();
        createRequest.setTitle("Ingénieur Logiciel");
        createRequest.setCompanyId(1L);
        createRequest.setCategoryId(1L);

        updateRequest = new UpdateJobOfferRequest();
        updateRequest.setTitle("Senior Ingénieur Logiciel");
        updateRequest.setCompanyId(1L);
        updateRequest.setCategoryId(1L);

        company = new Company();
        company.setId(1L);
        company.setUserId(100L);
        company.setName("Tech Corp");

        category = new JobCategory();
        category.setId(1L);
        category.setName("IT");

        jobOffer = new JobOffer();
        jobOffer.setId(1L);
        jobOffer.setTitle("Ingénieur Logiciel");
        jobOffer.setCompany(company);
        jobOffer.setCategory(category);
        jobOffer.setStatus(JobStatus.ACTIVE);
        jobOffer.setPostedByUserId(100L);

        jobOfferResponse = new JobOfferResponse();
        jobOfferResponse.setId(1L);
        jobOfferResponse.setTitle("Ingénieur Logiciel");
    }

    // ============================================
    // createJobOffer Tests
    // ============================================

    @Test
    void shouldCreateJobOfferSuccessfully() {
        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(jobMapper.toEntity(any(CreateJobOfferRequest.class))).thenReturn(jobOffer);
        when(jobOfferRepository.save(any(JobOffer.class))).thenReturn(jobOffer);
        when(jobMapper.toResponse(any(JobOffer.class))).thenReturn(jobOfferResponse);

        JobOfferResponse response = jobOfferService.createJobOffer(createRequest, 100L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Ingénieur Logiciel", response.getTitle());
        verify(jobOfferRepository, times(1)).save(any(JobOffer.class));
    }

    @Test
    void shouldThrowJobExceptionWhenUserIdIsNullForCreation() {
        assertThrows(JobException.class, () -> jobOfferService.createJobOffer(createRequest, (Long) null));
        verify(jobOfferRepository, never()).save(any());
    }

    @Test
    void shouldThrowJobExceptionWhenCompanyBelongsToAnotherUser() {
        company.setUserId(999L); // Différent de 100L
        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));

        JobException ex = assertThrows(JobException.class, () -> jobOfferService.createJobOffer(createRequest, 100L));
        assertTrue(ex.getMessage().contains("n'appartient pas à cet utilisateur"));
        verify(jobOfferRepository, never()).save(any());
    }

    // ============================================
    // updateJobOffer Tests
    // ============================================

    @Test
    void shouldUpdateJobOfferSuccessfully() {
        when(jobOfferRepository.findById(1L)).thenReturn(Optional.of(jobOffer));
        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        doNothing().when(jobMapper).updateFromRequest(any(UpdateJobOfferRequest.class), any(JobOffer.class));
        when(jobOfferRepository.save(any(JobOffer.class))).thenReturn(jobOffer);
        when(jobMapper.toResponse(any(JobOffer.class))).thenReturn(jobOfferResponse);

        JobOfferResponse response = jobOfferService.updateJobOffer(1L, updateRequest, 100L);

        assertNotNull(response);
        verify(jobOfferRepository, times(1)).save(jobOffer);
    }

    @Test
    void shouldThrowExceptionWhenUpdateJobOfferNotFound() {
        when(jobOfferRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> jobOfferService.updateJobOffer(999L, updateRequest, 100L));
    }

    // ============================================
    // getJobOfferById Tests
    // ============================================

    @Test
    void shouldGetJobOfferByIdSuccessfully() {
        when(jobOfferRepository.findById(1L)).thenReturn(Optional.of(jobOffer));
        when(jobMapper.toResponse(any(JobOffer.class))).thenReturn(jobOfferResponse);

        JobOfferResponse response = jobOfferService.getJobOfferById(1L);

        assertNotNull(response);
        assertEquals("Ingénieur Logiciel", response.getTitle());
    }

    @Test
    void shouldThrowExceptionWhenJobOfferIdNotFound() {
        when(jobOfferRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> jobOfferService.getJobOfferById(1L));
    }

    // ============================================
    // getAll, getByCompany, getByCategory Tests
    // ============================================

    @Test
    void shouldGetAllJobOffersSuccessfully() {
        Page<JobOffer> page = new PageImpl<>(Collections.singletonList(jobOffer));
        when(jobOfferRepository.findAll(any(Pageable.class))).thenReturn(page);
        when(jobMapper.toResponse(any(JobOffer.class))).thenReturn(jobOfferResponse);

        Page<JobOfferResponse> responsePage = jobOfferService.getAllJobOffers(PageRequest.of(0, 10));

        assertNotNull(responsePage);
        assertEquals(1, responsePage.getTotalElements());
    }

    @Test
    void shouldGetJobOffersByCompanySuccessfully() {
        Page<JobOffer> page = new PageImpl<>(Collections.singletonList(jobOffer));
        when(companyRepository.existsById(1L)).thenReturn(true);
        when(jobOfferRepository.findByCompanyId(eq(1L), any(Pageable.class))).thenReturn(page);
        when(jobMapper.toResponse(any(JobOffer.class))).thenReturn(jobOfferResponse);

        Page<JobOfferResponse> responsePage = jobOfferService.getJobOffersByCompany(1L, PageRequest.of(0, 10));

        assertNotNull(responsePage);
        assertEquals(1, responsePage.getTotalElements());
    }

    @Test
    void shouldThrowExceptionWhenCompanyNotFoundForOffers() {
        when(companyRepository.existsById(1L)).thenReturn(false);
        assertThrows(ResourceNotFoundException.class, () -> jobOfferService.getJobOffersByCompany(1L, PageRequest.of(0, 10)));
    }

    @Test
    void shouldGetJobOffersByCategorySuccessfully() {
        Page<JobOffer> page = new PageImpl<>(Collections.singletonList(jobOffer));
        when(categoryRepository.existsById(1L)).thenReturn(true);
        when(jobOfferRepository.findByCategoryId(eq(1L), any(Pageable.class))).thenReturn(page);
        when(jobMapper.toResponse(any(JobOffer.class))).thenReturn(jobOfferResponse);

        Page<JobOfferResponse> responsePage = jobOfferService.getJobOffersByCategory(1L, PageRequest.of(0, 10));

        assertNotNull(responsePage);
        assertEquals(1, responsePage.getTotalElements());
    }

    @Test
    void shouldThrowExceptionWhenCategoryNotFoundForOffers() {
        when(categoryRepository.existsById(1L)).thenReturn(false);
        assertThrows(ResourceNotFoundException.class, () -> jobOfferService.getJobOffersByCategory(1L, PageRequest.of(0, 10)));
    }

    // ============================================
    // Specific Listings (Urgent, Featured, MyOffers)
    // ============================================

    @Test
    void shouldReturnUrgentOffers() {
        when(jobOfferRepository.findByIsUrgentTrue()).thenReturn(Arrays.asList(jobOffer));
        when(jobMapper.toResponse(any())).thenReturn(jobOfferResponse);

        List<JobOfferResponse> result = jobOfferService.getUrgentOffers();
        assertEquals(1, result.size());
    }

    @Test
    void shouldReturnEmptyListForFeaturedOffersWhenNoData() {
        when(jobOfferRepository.findByIsFeaturedTrue()).thenReturn(Collections.emptyList());

        List<JobOfferResponse> result = jobOfferService.getFeaturedOffers();
        assertTrue(result.isEmpty());
    }

    @Test
    void shouldReturnMyPostedOffers() {
        when(jobOfferRepository.findByPostedByUserId(100L)).thenReturn(Arrays.asList(jobOffer));
        when(jobMapper.toResponse(any())).thenReturn(jobOfferResponse);

        List<JobOfferResponse> result = jobOfferService.getMyPostedOffers(100L);
        assertEquals(1, result.size());
    }

    // ============================================
    // deleteJobOffer Tests
    // ============================================

    @Test
    void shouldDeleteJobOfferSuccessfully() {
        when(jobOfferRepository.existsById(1L)).thenReturn(true);

        assertDoesNotThrow(() -> jobOfferService.deleteJobOffer(1L));
        verify(jobOfferRepository, times(1)).deleteById(1L);
    }

    @Test
    void shouldThrowExceptionWhenDeletingNonExistentOffer() {
        when(jobOfferRepository.existsById(1L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> jobOfferService.deleteJobOffer(1L));
        verify(jobOfferRepository, never()).deleteById(anyLong());
    }
}
