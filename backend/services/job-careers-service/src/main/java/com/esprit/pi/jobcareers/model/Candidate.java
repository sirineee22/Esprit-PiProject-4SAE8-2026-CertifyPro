package com.esprit.pi.jobcareers.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;
@Entity
@Table(name = "candidates")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Candidate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ LINK TO USER MICROSERVICE
    @Column(nullable = false, unique = true)
    private Long userId;

    private String firstName;
    private String lastName;
    private String email;
    private String phone;

    private String profilePicture;
    private String jobTitle;
    private String location;
    private String country;

    @Column(columnDefinition = "TEXT")
    private String bio;

    private String resumeUrl;
    private String linkedinUrl;
    private String portfolioUrl;

    private Double rating;
    private Long ratingCount;

    @ElementCollection
    @CollectionTable(name = "candidate_skills", joinColumns = @JoinColumn(name = "candidate_id"))
    @Column(name = "skill")
    private List<String> skills;

    @ElementCollection
    @CollectionTable(name = "candidate_certifications", joinColumns = @JoinColumn(name = "candidate_id"))
    @Column(name = "certification")
    private List<String> certifications;

    // ✅ ONLY INTERNAL MICROSERVICE RELATION
    @OneToMany(mappedBy = "candidate", cascade = CascadeType.ALL)
    private List<JobApplication> applications;

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @Transient
    public String getFullName() {
        return firstName + " " + lastName;
    }
}