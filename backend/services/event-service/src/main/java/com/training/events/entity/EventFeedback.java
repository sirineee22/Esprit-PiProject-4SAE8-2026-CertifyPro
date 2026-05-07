package com.training.events.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "event_feedbacks", uniqueConstraints = @UniqueConstraint(columnNames = {"event_id", "learner_id"}))
public class EventFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(name = "learner_id", nullable = false)
    private Long learnerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty", nullable = false)
    private Difficulty difficulty;

    @Column(name = "understood", nullable = false)
    private Boolean understood;

    @Column(name = "rating", nullable = false)
    private Integer rating;

    @Column(name = "what_next", columnDefinition = "TEXT")
    private String whatNext;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public enum Difficulty { EASY, MEDIUM, HARD }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Event getEvent() { return event; }
    public void setEvent(Event event) { this.event = event; }
    public Long getLearnerId() { return learnerId; }
    public void setLearnerId(Long learnerId) { this.learnerId = learnerId; }
    public Difficulty getDifficulty() { return difficulty; }
    public void setDifficulty(Difficulty difficulty) { this.difficulty = difficulty; }
    public Boolean getUnderstood() { return understood; }
    public void setUnderstood(Boolean understood) { this.understood = understood; }
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    public String getWhatNext() { return whatNext; }
    public void setWhatNext(String whatNext) { this.whatNext = whatNext; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
