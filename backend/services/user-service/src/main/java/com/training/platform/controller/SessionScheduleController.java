package com.training.platform.controller;

import com.training.platform.entity.SessionSchedule;
import com.training.platform.service.SessionScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedules")
public class SessionScheduleController {

    @Autowired
    private SessionScheduleService service;

    @GetMapping
    public ResponseEntity<List<SessionSchedule>> getAllSchedules() {
        return ResponseEntity.ok(service.getAllSchedules());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SessionSchedule> getScheduleById(@PathVariable Long id) {
        return service.getScheduleById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/trainer/{trainerId}")
    public ResponseEntity<List<SessionSchedule>> getSchedulesByTrainer(@PathVariable Long trainerId) {
        return ResponseEntity.ok(service.getSchedulesByTrainer(trainerId));
    }

    @PostMapping
    public ResponseEntity<?> createSchedule(@RequestBody SessionSchedule schedule) {
        try {
            SessionSchedule created = service.createSchedule(schedule);
            return new ResponseEntity<>(created, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<SessionSchedule> updateSchedule(@PathVariable Long id, @RequestBody SessionSchedule schedule) {
        try {
            return ResponseEntity.ok(service.updateSchedule(id, schedule));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Long id) {
        service.deleteSchedule(id);
        return ResponseEntity.noContent().build();
    }
}
