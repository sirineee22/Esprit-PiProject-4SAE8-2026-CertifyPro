package com.training.events.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "event_registrations", uniqueConstraints = @UniqueConstraint(columnNames = {"event_id", "learner_id"}))
public class EventRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(name = "learner_id", nullable = false)
    private Long learnerId;

    @Column(name = "learner_first_name")
    private String learnerFirstName;

    @Column(name = "learner_last_name")
    private String learnerLastName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RegistrationStatus status = RegistrationStatus.PENDING;

    @Column(name = "registered_at", nullable = false, updatable = false)
    private Instant registeredAt = Instant.now();

    public enum RegistrationStatus { PENDING, APPROVED, REJECTED, CANCELLED, ATTENDED, WAITLISTED, REGISTERED }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Event getEvent() { return event; }
    public void setEvent(Event event) { this.event = event; }
    public Long getLearnerId() { return learnerId; }
    public void setLearnerId(Long learnerId) { this.learnerId = learnerId; }
    public RegistrationStatus getStatus() { return status; }
    public void setStatus(RegistrationStatus status) { this.status = status; }
    public Instant getRegisteredAt() { return registeredAt; }
    public void setRegisteredAt(Instant registeredAt) { this.registeredAt = registeredAt; }

    public String getLearnerFirstName() { return learnerFirstName; }
    public void setLearnerFirstName(String learnerFirstName) { this.learnerFirstName = learnerFirstName; }
    public String getLearnerLastName() { return learnerLastName; }
    public void setLearnerLastName(String learnerLastName) { this.learnerLastName = learnerLastName; }
}
