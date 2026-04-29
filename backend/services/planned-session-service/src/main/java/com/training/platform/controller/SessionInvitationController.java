package com.training.platform.controller;

import com.training.platform.client.UserServiceClient;
import com.training.platform.entity.SessionInvitation;
import com.training.platform.entity.SessionSchedule;
import com.training.platform.repository.SessionInvitationRepository;
import com.training.platform.repository.SessionScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedules/{sessionId}/invite")
public class SessionInvitationController {

    @Autowired
    private SessionInvitationRepository invitationRepository;

    @Autowired
    private SessionScheduleRepository scheduleRepository;

    @Autowired
    private UserServiceClient userServiceClient;

    @PostMapping
    public ResponseEntity<?> inviteStudent(@PathVariable Long sessionId, @RequestParam String studentName) {
        SessionSchedule schedule = scheduleRepository.findById(sessionId).orElse(null);
        if (schedule == null)
            return ResponseEntity.notFound().build();

        List<UserServiceClient.UserDto> users = userServiceClient.searchUsers(studentName);
        if (users == null || users.isEmpty()) {
            return ResponseEntity.badRequest().body("No student found with name: " + studentName);
        }

        // Pick the first match
        UserServiceClient.UserDto student = users.get(0);

        SessionInvitation invitation = new SessionInvitation();
        invitation.setSessionSchedule(schedule);
        invitation.setStudentId(student.id);
        invitation.setStudentName(student.firstName + " " + student.lastName);
        invitation.setStudentEmail(student.email);

        invitationRepository.save(invitation);

        // Simulating sending notification
        System.out.println("Notification sent to " + student.email + " for session " + schedule.getTopic());

        return ResponseEntity.ok("Student " + student.firstName + " invited successfully and notification sent.");
    }

    @GetMapping
    public ResponseEntity<List<SessionInvitation>> getInvitations(@PathVariable Long sessionId) {
        return ResponseEntity.ok(invitationRepository.findBySessionScheduleId(sessionId));
    }
}
