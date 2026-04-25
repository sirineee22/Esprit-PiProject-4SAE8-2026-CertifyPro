package com.esprit.pi.jobcareers.dto.response;

import com.esprit.pi.jobcareers.enums.ApplicationStatus;
import com.esprit.pi.jobcareers.enums.ContractType;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class JobApplicationResponse {

    private Long id;
    private String applicationId;

    private Long jobOfferId;
    private String jobTitle;

    private Long candidateId;
    private String candidateName;
    private String candidateEmail;

    private String companyName;
    private String designation;

    private ContractType contractType;
    private ApplicationStatus status;

    private LocalDate applyDate;
    private String coverLetter;
    private String resumeUrl;

    private String recruiterNotes;
    private LocalDateTime createdAt;

    // ── Interview ─────────────────────────────────────────────
    private LocalDateTime interviewDate;
    private String        interviewLink;
    private String        interviewNotes;
}