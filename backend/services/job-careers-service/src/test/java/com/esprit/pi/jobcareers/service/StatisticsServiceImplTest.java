package com.esprit.pi.jobcareers.service;

import com.esprit.pi.jobcareers.dto.response.DashboardStats;
import com.esprit.pi.jobcareers.enums.ApplicationStatus;
import com.esprit.pi.jobcareers.model.JobApplication;
import com.esprit.pi.jobcareers.model.JobOffer;
import com.esprit.pi.jobcareers.repository.CandidateRepository;
import com.esprit.pi.jobcareers.repository.CompanyRepository;
import com.esprit.pi.jobcareers.repository.JobApplicationRepository;
import com.esprit.pi.jobcareers.repository.JobOfferRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)   // ← allows unused stubs in @BeforeEach
class StatisticsServiceImplTest {

    @Mock private JobApplicationRepository applicationRepository;
    @Mock private JobOfferRepository       jobOfferRepository;
    @Mock private CompanyRepository        companyRepository;
    @Mock private CandidateRepository      candidateRepository;

    @InjectMocks
    private StatisticsServiceImpl statisticsService;

    // ── helpers ──────────────────────────────────────────────────────────────

    /** Stub all repository calls with safe defaults so getDashboardStats() never NPEs. */
    @BeforeEach
    void stubDefaults() {
        when(applicationRepository.count()).thenReturn(0L);
        when(applicationRepository.countByMonthAndYear(anyInt(), anyInt())).thenReturn(0L);
        when(applicationRepository.countByStatus(any(ApplicationStatus.class))).thenReturn(0L);
        when(applicationRepository.findAllWithRelations(any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));
        when(jobOfferRepository.count()).thenReturn(0L);
        when(jobOfferRepository.findAll()).thenReturn(Collections.emptyList());
        when(companyRepository.count()).thenReturn(0L);
        when(candidateRepository.count()).thenReturn(0L);
    }

    // ── TEST 1: basic happy path ──────────────────────────────────────────────

    @Test
    void shouldReturnDashboardStats_withCorrectTotals() {
        when(applicationRepository.count()).thenReturn(100L);
        when(applicationRepository.countByStatus(ApplicationStatus.APPROVED)).thenReturn(20L);
        when(applicationRepository.countByStatus(ApplicationStatus.REJECTED)).thenReturn(15L);
        when(applicationRepository.countByStatus(ApplicationStatus.INTERVIEW)).thenReturn(10L);
        when(jobOfferRepository.count()).thenReturn(50L);
        when(companyRepository.count()).thenReturn(8L);
        when(candidateRepository.count()).thenReturn(200L);

        DashboardStats result = statisticsService.getDashboardStats();

        assertNotNull(result);
        assertEquals(100L, result.getTotalApplications());
        assertEquals(20L,  result.getTotalHired());
        assertEquals(15L,  result.getTotalRejected());
        assertEquals(10L,  result.getTotalInterviewed());
        assertEquals(50L,  result.getTotalPublishedJobs());
        assertEquals(8L,   result.getTotalCompanies());
        assertEquals(200L, result.getTotalCandidates());
    }

    // ── TEST 2: null safety — countByMonthAndYear returns null ───────────────

    @Test
    void shouldHandleNullMonthlyCount_gracefully() {
        when(applicationRepository.countByMonthAndYear(anyInt(), anyInt())).thenReturn(null);

        DashboardStats result = statisticsService.getDashboardStats();

        assertNotNull(result);
        assertEquals(0L, result.getTotalApplications());
        // Monthly lists must still have 12 entries
        assertNotNull(result.getMonthlyApplications());
        assertEquals(12, result.getMonthlyApplications().size());
    }

    // ── TEST 3: growth percent — previous month is zero → 100% ──────────────

    @Test
    void shouldReturn100PercentGrowth_whenPreviousMonthIsZero() {
        when(applicationRepository.countByMonthAndYear(anyInt(), anyInt()))
                .thenAnswer(inv -> {
                    int month = inv.getArgument(0);
                    // current month has apps, previous month has 0
                    return (month == LocalDate.now().getMonthValue()) ? 5L : 0L;
                });

        DashboardStats result = statisticsService.getDashboardStats();

        assertEquals(100.0, result.getApplicationGrowthPercent());
    }

    // ── TEST 4: monthly lists have exactly 12 entries ────────────────────────

    @Test
    void shouldReturn12MonthlyEntries() {
        DashboardStats result = statisticsService.getDashboardStats();

        assertEquals(12, result.getMonthlyApplications().size());
        assertEquals(12, result.getMonthlyInterviews().size());
        assertEquals(12, result.getMonthlyHired().size());
        assertEquals(12, result.getMonthlyRejected().size());
    }

    // ── TEST 5: applicationsByStatus map contains all statuses ───────────────

    @Test
    void shouldContainAllApplicationStatuses() {
        DashboardStats result = statisticsService.getDashboardStats();

        assertNotNull(result.getApplicationsByStatus());
        for (ApplicationStatus s : ApplicationStatus.values()) {
            assertTrue(result.getApplicationsByStatus().containsKey(s.name()),
                    "Missing status: " + s.name());
        }
    }

    // ── TEST 6: jobs by contract type aggregation ─────────────────────────────

    @Test
    void shouldAggregateJobsByContractType() {
        JobOffer j1 = new JobOffer();
        j1.setContractType(com.esprit.pi.jobcareers.enums.ContractType.FULL_TIME);
        JobOffer j2 = new JobOffer();
        j2.setContractType(com.esprit.pi.jobcareers.enums.ContractType.FULL_TIME);
        JobOffer j3 = new JobOffer();
        j3.setContractType(com.esprit.pi.jobcareers.enums.ContractType.INTERNSHIP);

        when(jobOfferRepository.findAll()).thenReturn(List.of(j1, j2, j3));

        DashboardStats result = statisticsService.getDashboardStats();

        assertEquals(2L, result.getJobsByContractType().get("FULL_TIME"));
        assertEquals(1L, result.getJobsByContractType().get("INTERNSHIP"));
    }

    // ── TEST 7: jobs by country — top 8 only ─────────────────────────────────

    @Test
    void shouldLimitJobsByCountryToTop8() {
        List<JobOffer> jobs = new java.util.ArrayList<>();
        String[] countries = {"TN","FR","US","DE","GB","ES","IT","MA","CA","JP"};
        for (int i = 0; i < countries.length; i++) {
            JobOffer j = new JobOffer();
            j.setCountry(countries[i]);
            jobs.add(j);
        }
        when(jobOfferRepository.findAll()).thenReturn(jobs);

        DashboardStats result = statisticsService.getDashboardStats();

        assertTrue(result.getJobsByCountry().size() <= 8);
    }

    // ── TEST 8: recent applications list ─────────────────────────────────────

    @Test
    void shouldReturnRecentApplications() {
        JobApplication app = new JobApplication();
        app.setApplyDate(LocalDate.now());
        app.setStatus(ApplicationStatus.NEW);

        when(applicationRepository.findAllWithRelations(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(app)));

        DashboardStats result = statisticsService.getDashboardStats();

        assertNotNull(result.getRecentApplications());
        assertEquals(1, result.getRecentApplications().size());
    }

    // ── TEST 9: all zeros when DB is empty ───────────────────────────────────

    @Test
    void shouldReturnAllZeros_whenDatabaseIsEmpty() {
        DashboardStats result = statisticsService.getDashboardStats();

        assertEquals(0L, result.getTotalApplications());
        assertEquals(0L, result.getTotalHired());
        assertEquals(0L, result.getTotalRejected());
        assertEquals(0L, result.getTotalInterviewed());
        assertEquals(0L, result.getTotalPublishedJobs());
        assertEquals(0L, result.getTotalCompanies());
        assertEquals(0L, result.getTotalCandidates());
    }
}
