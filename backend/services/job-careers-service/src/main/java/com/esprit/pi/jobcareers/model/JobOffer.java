package com.esprit.pi.jobcareers.model;

import com.esprit.pi.jobcareers.enums.ContractType;
import com.esprit.pi.jobcareers.enums.ExperienceLevel;
import com.esprit.pi.jobcareers.enums.JobStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
@Entity
@Table(name = "job_offers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JobOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String position;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    private ContractType contractType;

    @Enumerated(EnumType.STRING)
    private ExperienceLevel experienceLevel;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private JobStatus status = JobStatus.ACTIVE;

    private Integer numberOfVacancy;
    private Double startSalary;
    private Double lastSalary;

    private String country;
    private String state;
    private String location;

    private LocalDate lastDateToApply;
    private LocalDate closeDate;
    private LocalDate postDate;

    @ElementCollection
    @CollectionTable(name = "job_offer_tags", joinColumns = @JoinColumn(name = "job_offer_id"))
    @Column(name = "tag")
    private List<String> tags;

    @Builder.Default
    private Boolean isUrgent = false;

    @Builder.Default
    private Boolean isRemote = false;

    @Builder.Default
    private Boolean isPrivate = false;

    @Builder.Default
    private Boolean isFeatured = false;

    @Builder.Default
    private Integer applicationCount = 0;

    // ✅ user microservice link
    private Long postedByUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private JobCategory category;

    @OneToMany(mappedBy = "jobOffer", cascade = CascadeType.ALL)
    private List<JobApplication> applications;

    @OneToMany(mappedBy = "jobOffer", cascade = CascadeType.ALL)
    private List<SavedJob> savedByUsers;

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (postDate == null) postDate = LocalDate.now();
        if (applicationCount == null) applicationCount = 0;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}