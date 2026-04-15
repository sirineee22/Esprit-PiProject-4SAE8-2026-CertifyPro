package com.training.platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "workgroups")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Workgroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "teacher_id", nullable = false)
    private Long teacherId;

    @Column(name = "teacher_name")
    private String teacherName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GroupVisibility visibility = GroupVisibility.PUBLIC;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum GroupVisibility {
        PUBLIC, PRIVATE
    }
}
