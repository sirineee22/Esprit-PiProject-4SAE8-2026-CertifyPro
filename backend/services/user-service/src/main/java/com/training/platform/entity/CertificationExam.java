package com.training.platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Entity
@Table(name = "certification_exams")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CertificationExam {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String certificationCode;

    @NotBlank
    private String title;

    private Integer durationMinutes;
    private Double passingScore;
    private Integer maxAttemptsPerUser;
    private Boolean isActive;

    @Column(name = "questions_json", columnDefinition = "TEXT")
    private String questionsJson;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Logic Methods
    public boolean isPassing(Double score) {
        return score != null && score >= passingScore;
    }

    public boolean hasAttemptsLeft(int userAttempts) {
        return maxAttemptsPerUser == null || userAttempts < maxAttemptsPerUser;
    }
}
