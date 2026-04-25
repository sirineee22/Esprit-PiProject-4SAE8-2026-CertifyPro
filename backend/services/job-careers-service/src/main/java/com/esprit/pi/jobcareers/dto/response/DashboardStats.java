package com.esprit.pi.jobcareers.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data @Builder
public class DashboardStats {
    // ── KPIs ─────────────────────────────────────────────────
    private Long   totalApplications;
    private Double applicationGrowthPercent;
    private Long   totalInterviewed;
    private Double interviewedGrowthPercent;
    private Long   totalHired;
    private Double hiredGrowthPercent;
    private Long   totalRejected;
    private Double rejectedGrowthPercent;
    private Long   totalPublishedJobs;
    private Long   totalCompanies;
    private Long   totalCandidates;

    // ── Monthly data (12 values Jan→Dec) ─────────────────────
    private List<Long> monthlyApplications;
    private List<Long> monthlyInterviews;
    private List<Long> monthlyHired;
    private List<Long> monthlyRejected;

    // ── Breakdowns ───────────────────────────────────────────
    private Map<String, Long> applicationsByStatus;   // NEW, PENDING, INTERVIEW, APPROVED, REJECTED
    private Map<String, Long> jobsByContractType;     // FULL_TIME, PART_TIME, FREELANCE, INTERNSHIP, REMOTE
    private Map<String, Long> jobsByCountry;          // country → count
    private Map<String, Long> jobsByCategory;         // category name → count

    // ── Recent applications ──────────────────────────────────
    private List<RecentApplicationDto> recentApplications;

    @Data @Builder
    public static class RecentApplicationDto {
        private Long   id;
        private String candidateName;
        private String candidateEmail;
        private String jobTitle;
        private String companyName;
        private String applyDate;
        private String status;
    }
}
