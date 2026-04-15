package com.training.platform.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String action; // e.g., "USER_UPDATE", "USER_DELETE", "TRAINER_APPROVE"

    private Long actorId;
    private String actorEmail;
    
    private String targetType; // e.g., "USER", "EVENT"
    private String targetId;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public AuditLog(String action, Long actorId, String actorEmail, String targetType, String targetId, String details) {
        this.action = action;
        this.actorId = actorId;
        this.actorEmail = actorEmail;
        this.targetType = targetType;
        this.targetId = targetId;
        this.details = details;
        this.createdAt = Instant.now();
    }
}
