package com.esprit.pi.jobcareers.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "job_alerts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JobAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    private String keyword;
    private String contractType;
    private String location;

    @Builder.Default
    private boolean active = true;

    @ElementCollection
    @CollectionTable(name = "job_alert_matches", joinColumns = @JoinColumn(name = "alert_id"))
    @Column(name = "job_id")
    @Builder.Default
    private List<Long> matchedJobIds = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;
}