package com.esprit.pi.jobcareers.model;

import com.esprit.pi.jobcareers.enums.ApplicationStatus;
import com.esprit.pi.jobcareers.enums.ContractType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
@Entity
@Table(name = "job_applications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JobApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String applicationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_offer_id", nullable = false)
    private JobOffer jobOffer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    // ✅ optional redundancy (NOT FK)
    private String companyName;
    private String designation;
    private String contacts;

    @Enumerated(EnumType.STRING)
    private ContractType contractType;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ApplicationStatus status = ApplicationStatus.NEW;

    private LocalDate applyDate;

    @Column(columnDefinition = "TEXT")
    private String coverLetter;

    private String resumeUrl;

    @Column(columnDefinition = "TEXT")
    private String recruiterNotes;

    // ── Interview fields ──────────────────────────────────────
    private LocalDateTime interviewDate;
    private String        interviewLink;

    @Column(columnDefinition = "TEXT")
    private String interviewNotes;

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (applyDate == null) applyDate = LocalDate.now();
        if (applicationId == null)
            applicationId = "#VZ" + (int)(Math.random() * 900 + 100);
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}