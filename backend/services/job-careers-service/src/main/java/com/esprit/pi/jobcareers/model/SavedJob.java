package com.esprit.pi.jobcareers.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "saved_jobs",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "job_offer_id"})
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SavedJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ USER MICROSERVICE
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_offer_id", nullable = false)
    private JobOffer jobOffer;

    @CreationTimestamp
    private LocalDateTime savedAt;
}