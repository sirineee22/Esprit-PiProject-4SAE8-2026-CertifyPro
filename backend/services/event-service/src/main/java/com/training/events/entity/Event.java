package com.training.events.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "events", indexes = {
    @Index(name = "idx_events_status_date", columnList = "status, date_start")
})
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull
    @Column(name = "trainer_id", nullable = false)
    private Long trainerId;

    @Size(max = 100)
    @Column(name = "trainer_first_name")
    private String trainerFirstName;

    @Size(max = 100)
    @Column(name = "trainer_last_name")
    private String trainerLastName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventType type = EventType.WEBINAR;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventMode mode = EventMode.ONLINE;

    @NotNull
    @Column(name = "date_start", nullable = false)
    private Instant dateStart;

    @NotNull
    @Column(name = "date_end", nullable = false)
    private Instant dateEnd;

    @Size(max = 500)
    @Column(name = "meeting_link")
    private String meetingLink;

    @Size(max = 500)
    @Column(length = 500)
    private String location;

    @NotNull
    @Column(name = "max_participants", nullable = false)
    private Integer maxParticipants = 50;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventStatus status = EventStatus.UPCOMING;

    @Enumerated(EnumType.STRING)
    @Column(name = "learning_level")
    private LearningLevel learningLevel = LearningLevel.BEGINNER;

    @Size(max = 120)
    @Column(name = "category")
    private String category;

    @ElementCollection
    @CollectionTable(name = "event_required_skills", joinColumns = @JoinColumn(name = "event_id"))
    @Column(name = "skill")
    private List<String> requiredSkills = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt;

    @ElementCollection
    @CollectionTable(name = "event_programs", joinColumns = @JoinColumn(name = "event_id"))
    private List<ProgramItem> program = new ArrayList<>();

    /** Not persisted; set when building list response so JSON has correct count. */
    @Transient
    private Integer participantCount;

    @Transient
    private Double recommendationScore;

    @Transient
    private List<String> recommendationReasons;

    public enum EventType { WEBINAR, WORKSHOP, QNA, MEETUP, BOOTCAMP }
    public enum EventMode { ONLINE, ONSITE, HYBRID }
    public enum EventStatus { UPCOMING, CANCELLED, DONE }
    public enum LearningLevel { BEGINNER, INTERMEDIATE, ADVANCED }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integer getParticipantCount() { return participantCount != null ? participantCount : 0; }
    public void setParticipantCount(Integer participantCount) { this.participantCount = participantCount; }
    public Double getRecommendationScore() { return recommendationScore; }
    public void setRecommendationScore(Double recommendationScore) { this.recommendationScore = recommendationScore; }
    public List<String> getRecommendationReasons() { return recommendationReasons; }
    public void setRecommendationReasons(List<String> recommendationReasons) { this.recommendationReasons = recommendationReasons; }
    public Integer getWaitlistCount() { return 0; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getTrainerId() { return trainerId; }
    public void setTrainerId(Long trainerId) { this.trainerId = trainerId; }
    public String getTrainerFirstName() { return trainerFirstName; }
    public void setTrainerFirstName(String trainerFirstName) { this.trainerFirstName = trainerFirstName; }
    public String getTrainerLastName() { return trainerLastName; }
    public void setTrainerLastName(String trainerLastName) { this.trainerLastName = trainerLastName; }
    public EventType getType() { return type; }
    public void setType(EventType type) { this.type = type; }
    public EventMode getMode() { return mode; }
    public void setMode(EventMode mode) { this.mode = mode; }
    public Instant getDateStart() { return dateStart; }
    public void setDateStart(Instant dateStart) { this.dateStart = dateStart; }
    public Instant getDateEnd() { return dateEnd; }
    public void setDateEnd(Instant dateEnd) { this.dateEnd = dateEnd; }
    public String getMeetingLink() { return meetingLink; }
    public void setMeetingLink(String meetingLink) { this.meetingLink = meetingLink; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public Integer getMaxParticipants() { return maxParticipants; }
    public void setMaxParticipants(Integer maxParticipants) { this.maxParticipants = maxParticipants; }
    public EventStatus getStatus() { return status; }
    public void setStatus(EventStatus status) { this.status = status; }
    public LearningLevel getLearningLevel() { return learningLevel != null ? learningLevel : LearningLevel.BEGINNER; }
    public void setLearningLevel(LearningLevel learningLevel) { this.learningLevel = learningLevel; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public List<String> getRequiredSkills() { return requiredSkills; }
    public void setRequiredSkills(List<String> requiredSkills) { this.requiredSkills = requiredSkills; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public List<ProgramItem> getProgram() { return program; }
    public void setProgram(List<ProgramItem> program) { this.program = program; }
}
