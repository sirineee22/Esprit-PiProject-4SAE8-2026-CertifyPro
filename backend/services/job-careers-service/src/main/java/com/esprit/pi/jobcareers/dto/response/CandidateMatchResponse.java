package com.esprit.pi.jobcareers.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class CandidateMatchResponse {
    private Long   candidateId;
    private Long   userId;
    private String firstName;
    private String lastName;
    private String fullName;
    private String jobTitle;
    private String location;
    private String country;
    private String resumeUrl;
    private String linkedinUrl;
    private List<String> skills;
    private List<String> certifications;
    private int    matchScore;
    private List<String> matchedSkills;
}
