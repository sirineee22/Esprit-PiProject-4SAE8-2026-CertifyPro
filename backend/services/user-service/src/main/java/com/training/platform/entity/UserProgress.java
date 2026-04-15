package com.training.platform.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "user_progress", uniqueConstraints = @UniqueConstraint(columnNames = "user_id"))
public class UserProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "xp_total", nullable = false)
    private Integer xpTotal = 0;

    @Column(name = "level_number", nullable = false)
    private Integer levelNumber = 1;

    @Column(name = "level_label", nullable = false, length = 80)
    private String levelLabel = "Beginner";

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Integer getXpTotal() { return xpTotal; }
    public void setXpTotal(Integer xpTotal) { this.xpTotal = xpTotal; }
    public Integer getLevelNumber() { return levelNumber; }
    public void setLevelNumber(Integer levelNumber) { this.levelNumber = levelNumber; }
    public String getLevelLabel() { return levelLabel; }
    public void setLevelLabel(String levelLabel) { this.levelLabel = levelLabel; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
