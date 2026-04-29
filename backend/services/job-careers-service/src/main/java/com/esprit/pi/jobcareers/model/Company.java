package com.esprit.pi.jobcareers.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
@Entity
@Table(name = "companies")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ USER MICROSERVICE LINK
    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, unique = true)
    private String name;

    private String logo;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String industryType;
    private String location;
    private String country;

    private Integer employeeMin;
    private Integer employeeMax;

    private String website;
    private String contactEmail;
    private String phone;

    private Double rating;
    private LocalDate foundedIn;

    private Integer vacancyCount;
    private String department;

    private String linkedinUrl;
    private String twitterUrl;
    private String facebookUrl;

    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL)
    private List<JobOffer> jobOffers;

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}