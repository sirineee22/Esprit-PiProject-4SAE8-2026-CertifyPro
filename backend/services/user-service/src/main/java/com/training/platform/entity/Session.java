package com.training.platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Session {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer capacity;
    private Integer enrolledCount = 0;

    @Enumerated(EnumType.STRING)
    private SessionStatus status;

    @Enumerated(EnumType.STRING)
    private SessionType type;

    private String location;
    private String meetingUrl;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

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
    public Integer getAvailablePlaces() {
        return (capacity != null) ? capacity - (enrolledCount != null ? enrolledCount : 0) : 0;
    }

    public boolean isOpenForEnrollment() {
        return status == SessionStatus.OPEN && !isFull();
    }

    public boolean isFull() {
        return capacity != null && enrolledCount != null && enrolledCount >= capacity;
    }
}
