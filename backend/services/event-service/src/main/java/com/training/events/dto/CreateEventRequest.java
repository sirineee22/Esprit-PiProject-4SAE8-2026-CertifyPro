package com.training.events.dto;

import com.training.events.entity.Event;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

public class CreateEventRequest {

    @NotBlank
    @Size(max = 200)
    private String title;

    private String description;

    @NotNull
    private Event.EventType type;

    @NotNull
    private Event.EventMode mode;

    @NotNull
    private Instant dateStart;

    @NotNull
    private Instant dateEnd;

    private String meetingLink;

    private String location;

    @NotNull
    private Integer maxParticipants;

    private String trainerFirstName;

    private String trainerLastName;

    private List<ProgramItemDto> program;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Event.EventType getType() { return type; }
    public void setType(Event.EventType type) { this.type = type; }
    public Event.EventMode getMode() { return mode; }
    public void setMode(Event.EventMode mode) { this.mode = mode; }
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
    public String getTrainerFirstName() { return trainerFirstName; }
    public void setTrainerFirstName(String trainerFirstName) { this.trainerFirstName = trainerFirstName; }
    public String getTrainerLastName() { return trainerLastName; }
    public void setTrainerLastName(String trainerLastName) { this.trainerLastName = trainerLastName; }
    public List<ProgramItemDto> getProgram() { return program; }
    public void setProgram(List<ProgramItemDto> program) { this.program = program; }
}
