package com.esprit.pi.jobcareers.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity @Table(name = "job_categories")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JobCategory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String icon;
    private String description;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<JobOffer> jobOffers;

    @Transient
    public int getPositionCount() {
        return jobOffers != null ? jobOffers.size() : 0;
    }
}