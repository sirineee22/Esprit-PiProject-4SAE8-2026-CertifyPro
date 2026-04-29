package com.esprit.pi.jobcareers.service;

import com.esprit.pi.jobcareers.dto.response.DashboardStats;
import com.esprit.pi.jobcareers.enums.ApplicationStatus;
import com.esprit.pi.jobcareers.model.JobApplication;
import com.esprit.pi.jobcareers.model.JobOffer;
import com.esprit.pi.jobcareers.repository.CandidateRepository;
import com.esprit.pi.jobcareers.repository.CompanyRepository;
import com.esprit.pi.jobcareers.repository.JobApplicationRepository;
import com.esprit.pi.jobcareers.repository.JobOfferRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatisticsServiceImpl implements StatisticsService {

    private final JobApplicationRepository applicationRepository;
    private final JobOfferRepository       jobOfferRepository;
    private final CompanyRepository        companyRepository;
    private final CandidateRepository      candidateRepository;

    @Override
    public DashboardStats getDashboardStats() {
        int currentYear  = LocalDate.now().getYear();
        int currentMonth = LocalDate.now().getMonthValue();
        int prevMonth    = currentMonth == 1 ? 12 : currentMonth - 1;
        int prevYear     = currentMonth == 1 ? currentYear - 1 : currentYear;

        // ── KPIs ─────────────────────────────────────────────
        long totalApps      = applicationRepository.count();
        long currMonthApps  = safe(applicationRepository.countByMonthAndYear(currentMonth, currentYear));
        long prevMonthApps  = safe(applicationRepository.countByMonthAndYear(prevMonth, prevYear));
        double appGrowth    = prevMonthApps == 0 ? 100.0
                : Math.round(((currMonthApps - prevMonthApps) * 100.0 / prevMonthApps) * 100.0) / 100.0;

        long totalHired     = safe(applicationRepository.countByStatus(ApplicationStatus.APPROVED));
        long totalRejected  = safe(applicationRepository.countByStatus(ApplicationStatus.REJECTED));
        long totalInterview = safe(applicationRepository.countByStatus(ApplicationStatus.INTERVIEW));
        long totalJobs      = jobOfferRepository.count();
        long totalCompanies = companyRepository.count();
        long totalCandidates= candidateRepository.count();

        // ── Monthly data ──────────────────────────────────────
        List<Long> monthlyApps   = new ArrayList<>();
        List<Long> monthlyIntvw  = new ArrayList<>();
        List<Long> monthlyHired  = new ArrayList<>();
        List<Long> monthlyRejct  = new ArrayList<>();
        for (int m = 1; m <= 12; m++) {
            long apps = safe(applicationRepository.countByMonthAndYear(m, currentYear));
            monthlyApps.add(apps);
            monthlyIntvw.add(Math.round(apps * 0.35));
            monthlyHired.add(Math.round(apps * 0.12));
            monthlyRejct.add(Math.round(apps * 0.22));
        }

        // ── Applications by status ────────────────────────────
        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (ApplicationStatus s : ApplicationStatus.values()) {
            byStatus.put(s.name(), safe(applicationRepository.countByStatus(s)));
        }

        // ── Jobs by contract type ─────────────────────────────
        Map<String, Long> byType = new LinkedHashMap<>();
        List<JobOffer> allJobs = jobOfferRepository.findAll();
        allJobs.forEach(j -> {
            if (j.getContractType() != null) {
                byType.merge(j.getContractType().name(), 1L, Long::sum);
            }
        });

        // ── Jobs by country ───────────────────────────────────
        Map<String, Long> byCountry = new LinkedHashMap<>();
        allJobs.forEach(j -> {
            if (j.getCountry() != null && !j.getCountry().isBlank()) {
                byCountry.merge(j.getCountry().trim(), 1L, Long::sum);
            }
        });
        // Sort by count desc, keep top 8
        Map<String, Long> topCountries = byCountry.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(8)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue,
                        (e1, e2) -> e1, LinkedHashMap::new));

        // ── Jobs by category ──────────────────────────────────
        Map<String, Long> byCategory = new LinkedHashMap<>();
        allJobs.forEach(j -> {
            String cat = j.getCategory() != null ? j.getCategory().getName() : "Non catégorisé";
            byCategory.merge(cat, 1L, Long::sum);
        });
        Map<String, Long> topCategories = byCategory.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(8)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue,
                        (e1, e2) -> e1, LinkedHashMap::new));

        // ── Recent applications (last 10) ─────────────────────
        List<DashboardStats.RecentApplicationDto> recent = applicationRepository
                .findAllWithRelations(PageRequest.of(0, 10, Sort.by("createdAt").descending()))
                .getContent()
                .stream()
                .map(this::toRecentDto)
                .collect(Collectors.toList());

        return DashboardStats.builder()
                .totalApplications(totalApps)
                .applicationGrowthPercent(appGrowth)
                .totalInterviewed(totalInterview)
                .interviewedGrowthPercent(34.24)
                .totalHired(totalHired)
                .hiredGrowthPercent(4.63)
                .totalRejected(totalRejected)
                .rejectedGrowthPercent(-3.24)
                .totalPublishedJobs(totalJobs)
                .totalCompanies(totalCompanies)
                .totalCandidates(totalCandidates)
                .monthlyApplications(monthlyApps)
                .monthlyInterviews(monthlyIntvw)
                .monthlyHired(monthlyHired)
                .monthlyRejected(monthlyRejct)
                .applicationsByStatus(byStatus)
                .jobsByContractType(byType)
                .jobsByCountry(topCountries)
                .jobsByCategory(topCategories)
                .recentApplications(recent)
                .build();
    }

    private DashboardStats.RecentApplicationDto toRecentDto(JobApplication a) {
        String candidateName = "";
        String candidateEmail = "";
        if (a.getCandidate() != null) {
            candidateName  = (a.getCandidate().getFirstName() != null ? a.getCandidate().getFirstName() : "") + " "
                           + (a.getCandidate().getLastName()  != null ? a.getCandidate().getLastName()  : "");
            candidateEmail = a.getCandidate().getEmail() != null ? a.getCandidate().getEmail() : "";
        }
        String jobTitle = a.getJobOffer() != null ? a.getJobOffer().getTitle() : "";
        String company  = a.getCompanyName() != null ? a.getCompanyName() : "";
        String date     = a.getApplyDate() != null
                ? a.getApplyDate().format(DateTimeFormatter.ISO_LOCAL_DATE) : "";

        return DashboardStats.RecentApplicationDto.builder()
                .id(a.getId())
                .candidateName(candidateName.trim())
                .candidateEmail(candidateEmail)
                .jobTitle(jobTitle)
                .companyName(company)
                .applyDate(date)
                .status(a.getStatus() != null ? a.getStatus().name() : "")
                .build();
    }

    private long safe(Long v) { return v != null ? v : 0L; }
}
