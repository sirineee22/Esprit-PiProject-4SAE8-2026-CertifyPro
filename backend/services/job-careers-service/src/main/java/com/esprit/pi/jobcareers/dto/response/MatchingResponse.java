package com.esprit.pi.jobcareers.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data @Builder
public class MatchingResponse {
    private Long jobOfferId;
    private String jobTitle;
    private String companyName;
    private Long candidateId;
    private String candidateName;
    private int matchScore;
    private int skillsScore;
    private int certificationsScore;
    private int experienceScore;
    private int qualificationScore;
    private List<String> matchedSkills;
    private List<String> matchedCertifications;
    private List<String> missingSkills;
    private String matchLevel;  // EXCELLENT, BON, MOYEN, FAIBLE
}