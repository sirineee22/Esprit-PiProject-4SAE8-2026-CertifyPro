package com.training.platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "certifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Certification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String code;

    @NotBlank
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Integer validityMonths;
    private Double requiredScore;

    @Column(columnDefinition = "TEXT")
    private String criteriaDescription;

    private Boolean isActive;

    // Issued certificate fields
    private String uniqueCertificateId;
    private LocalDateTime issuedAt;
    private LocalDate expiresAt;
    private String pdfUrl;
    private String qrCodeUrl;

    @Enumerated(EnumType.STRING)
    private CertificateStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

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
    public boolean isEligible(User user) {
        // Placeholder logic
        return user != null && user.isActive();
    }

    public LocalDate getValidityEnd(LocalDate startDate) {
        return (validityMonths != null) ? startDate.plusMonths(validityMonths) : startDate;
    }

    public boolean isValid() {
        return Boolean.TRUE.equals(isActive) && !isExpired() && status == CertificateStatus.ACTIVE;
    }

    public boolean isExpired() {
        return expiresAt != null && expiresAt.isBefore(LocalDate.now());
    }

    public String getVerificationUrl() {
        return "https://certifypro.com/verify/" + uniqueCertificateId;
    }
}
