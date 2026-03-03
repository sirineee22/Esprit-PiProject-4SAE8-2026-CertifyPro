package com.training.platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "certification_attempts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CertificationAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double score;
    private Double maxScore;
    private Boolean passed;

    private LocalDateTime attemptedAt;
    private LocalDateTime completedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id")
    private CertificationExam certificationExam;

    public boolean isPassing() {
        return Boolean.TRUE.equals(passed);
    }
}
