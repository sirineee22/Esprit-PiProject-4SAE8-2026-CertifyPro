package com.training.platform.service;

import com.training.platform.entity.SessionSchedule;
import com.training.platform.repository.SessionScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SessionScheduleService {

    @Autowired
    private SessionScheduleRepository repository;

    public List<SessionSchedule> getAllSchedules() {
        return repository.findAll().stream()
                .map(this::evaluateAndSaveStatus)
                .collect(Collectors.toList());
    }

    public Optional<SessionSchedule> getScheduleById(Long id) {
        return repository.findById(id).map(this::evaluateAndSaveStatus);
    }

    public List<SessionSchedule> getSchedulesByTrainer(Long trainerId) {
        return repository.findByTrainerId(trainerId).stream()
                .map(this::evaluateAndSaveStatus)
                .collect(Collectors.toList());
    }

    private SessionSchedule evaluateAndSaveStatus(SessionSchedule schedule) {
        LocalDateTime now = LocalDateTime.now();
        com.training.platform.entity.SessionStatus currentStatus = schedule.getStatus();

        if (currentStatus != com.training.platform.entity.SessionStatus.CANCELLED) {
            if (now.isAfter(schedule.getStartTime()) && now.isBefore(schedule.getEndTime())) {
                if (currentStatus == com.training.platform.entity.SessionStatus.SCHEDULED) {
                    schedule.setStatus(com.training.platform.entity.SessionStatus.ONGOING);
                    return repository.save(schedule);
                }
            } else if (now.isAfter(schedule.getEndTime())) {
                // If it wasn't cancelled and the time passed, it's completed by default
                if (currentStatus == com.training.platform.entity.SessionStatus.ONGOING
                        || currentStatus == com.training.platform.entity.SessionStatus.SCHEDULED) {
                    schedule.setStatus(com.training.platform.entity.SessionStatus.COMPLETED);
                    return repository.save(schedule);
                }
            }
        }
        return schedule;
    }

    public SessionSchedule createSchedule(SessionSchedule schedule) {
        // Basic conflict validation
        if (repository.existsByRoomIdAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(
                schedule.getRoom().getId(), schedule.getEndTime(), schedule.getStartTime())) {
            throw new IllegalArgumentException("Room is already booked for this time period");
        }
        if (repository.existsByTrainerIdAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(
                schedule.getTrainerId(), schedule.getEndTime(), schedule.getStartTime())) {
            throw new IllegalArgumentException("Trainer is already booked for this time period");
        }
        return repository.save(schedule);
    }

    public SessionSchedule updateSchedule(Long id, SessionSchedule updatedSchedule) {
        return repository.findById(id).map(schedule -> {
            schedule.setTopic(updatedSchedule.getTopic());
            schedule.setStartTime(updatedSchedule.getStartTime());
            schedule.setEndTime(updatedSchedule.getEndTime());
            schedule.setTrainerId(updatedSchedule.getTrainerId());
            schedule.setRoom(updatedSchedule.getRoom());
            schedule.setCourseId(updatedSchedule.getCourseId());

            // For general updates, we only allow updating status if it's currently
            // SCHEDULED or CANCELLED
            // and the session hasn't started yet.
            if (schedule.getStatus() != updatedSchedule.getStatus()) {
                validateStatusChange(schedule, updatedSchedule.getStatus());
                schedule.setStatus(updatedSchedule.getStatus());
            }

            return repository.save(schedule);
        }).orElseThrow(() -> new RuntimeException("Schedule not found with id " + id));
    }

    public SessionSchedule updateSessionStatus(Long id, com.training.platform.entity.SessionStatus newStatus) {
        return repository.findById(id).map(schedule -> {
            validateStatusChange(schedule, newStatus);
            schedule.setStatus(newStatus);
            return repository.save(schedule);
        }).orElseThrow(() -> new RuntimeException("Schedule not found with id " + id));
    }

    private void validateStatusChange(SessionSchedule schedule, com.training.platform.entity.SessionStatus newStatus) {
        LocalDateTime now = LocalDateTime.now();

        // Cannot change status if session has already started or finished
        if (now.isAfter(schedule.getStartTime())) {
            throw new IllegalArgumentException(
                    "Cannot manually change status once the session time has started or passed.");
        }

        // Trainers can only toggle between SCHEDULED and CANCELLED
        if (newStatus != com.training.platform.entity.SessionStatus.SCHEDULED &&
                newStatus != com.training.platform.entity.SessionStatus.CANCELLED) {
            throw new IllegalArgumentException("Trainers can only set status to SCHEDULED or CANCELLED.");
        }
    }

    public void deleteSchedule(Long id) {

        repository.deleteById(id);
    }
}
