package com.training.platform.service;

import com.training.platform.entity.SessionSchedule;
import com.training.platform.repository.SessionScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class SessionScheduleService {

    @Autowired
    private SessionScheduleRepository repository;

    public List<SessionSchedule> getAllSchedules() {
        return repository.findAll();
    }

    public Optional<SessionSchedule> getScheduleById(Long id) {
        return repository.findById(id);
    }

    public List<SessionSchedule> getSchedulesByTrainer(Long trainerId) {
        return repository.findByTrainerId(trainerId);
    }

    public SessionSchedule createSchedule(SessionSchedule schedule) {
        // Basic conflict validation
        if (repository.existsByRoomAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(
                schedule.getRoom(), schedule.getEndTime(), schedule.getStartTime())) {
            throw new IllegalArgumentException("Room is already booked for this time period");
        }
        if (repository.existsByTrainerIdAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(
                schedule.getTrainer().getId(), schedule.getEndTime(), schedule.getStartTime())) {
            throw new IllegalArgumentException("Trainer is already booked for this time period");
        }
        return repository.save(schedule);
    }

    public SessionSchedule updateSchedule(Long id, SessionSchedule updatedSchedule) {
        return repository.findById(id).map(schedule -> {
            schedule.setTopic(updatedSchedule.getTopic());
            schedule.setStartTime(updatedSchedule.getStartTime());
            schedule.setEndTime(updatedSchedule.getEndTime());
            schedule.setTrainer(updatedSchedule.getTrainer());
            schedule.setRoom(updatedSchedule.getRoom());
            schedule.setCourseId(updatedSchedule.getCourseId());
            // Need further conflict check here ideally
            return repository.save(schedule);
        }).orElseThrow(() -> new RuntimeException("Schedule not found with id " + id));
    }

    public void deleteSchedule(Long id) {
        repository.deleteById(id);
    }
}
