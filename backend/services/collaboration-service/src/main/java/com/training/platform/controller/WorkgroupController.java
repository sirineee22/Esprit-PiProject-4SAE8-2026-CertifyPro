package com.training.platform.controller;

import com.training.platform.client.UserServiceClient;
import com.training.platform.entity.GroupMembership;
import com.training.platform.entity.GroupMessage;
import com.training.platform.entity.Workgroup;
import com.training.platform.repository.GroupMembershipRepository;
import com.training.platform.repository.GroupMessageRepository;
import com.training.platform.repository.WorkgroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/groups")
public class WorkgroupController {

    @Autowired
    private WorkgroupRepository groupRepo;

    @Autowired
    private GroupMembershipRepository membershipRepo;

    @Autowired
    private GroupMessageRepository messageRepo;

    @Autowired
    private UserServiceClient userServiceClient;

    // ── Group CRUD ──────────────────────────────────

    @PostMapping
    public ResponseEntity<?> createGroup(@RequestBody Workgroup group) {
        if (group.getName() == null || group.getName().isBlank()) {
            return ResponseEntity.badRequest().body("Group name is required");
        }
        Workgroup saved = groupRepo.save(group);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/public")
    public ResponseEntity<List<Workgroup>> getPublicGroups() {
        return ResponseEntity.ok(groupRepo.findByVisibility(Workgroup.GroupVisibility.PUBLIC));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Workgroup>> getMyGroups(@RequestParam Long userId) {
        // Groups where user is teacher
        List<Workgroup> teacherGroups = groupRepo.findByTeacherId(userId);

        // Groups where user is a member
        List<Long> memberGroupIds = membershipRepo.findByStudentId(userId)
                .stream().map(m -> m.getWorkgroup().getId()).collect(Collectors.toList());
        List<Workgroup> memberGroups = groupRepo.findAllById(memberGroupIds);

        // Merge, deduplicate
        teacherGroups.addAll(memberGroups);
        List<Workgroup> unique = teacherGroups.stream().distinct().collect(Collectors.toList());
        return ResponseEntity.ok(unique);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getGroupById(@PathVariable Long id) {
        return groupRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── Members ─────────────────────────────────────

    @PostMapping("/{id}/members")
    public ResponseEntity<?> addMember(@PathVariable Long id, @RequestParam String studentName) {
        Workgroup group = groupRepo.findById(id).orElse(null);
        if (group == null)
            return ResponseEntity.notFound().build();

        List<UserServiceClient.UserDto> users = userServiceClient.searchUsers(studentName);
        if (users == null || users.isEmpty()) {
            return ResponseEntity.badRequest().body("No student found with name: " + studentName);
        }

        UserServiceClient.UserDto student = users.get(0);

        if (membershipRepo.existsByWorkgroupIdAndStudentId(id, student.id)) {
            return ResponseEntity.badRequest().body("Student is already a member of this group");
        }

        GroupMembership membership = new GroupMembership();
        membership.setWorkgroup(group);
        membership.setStudentId(student.id);
        membership.setStudentName(student.firstName + " " + student.lastName);
        membershipRepo.save(membership);

        return ResponseEntity.ok("Student " + student.firstName + " added successfully");
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<?> joinGroup(@PathVariable Long id, @RequestParam Long userId,
            @RequestParam String userName) {
        Workgroup group = groupRepo.findById(id).orElse(null);
        if (group == null)
            return ResponseEntity.notFound().build();

        if (group.getVisibility() == Workgroup.GroupVisibility.PRIVATE) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Cannot join a private group");
        }

        if (membershipRepo.existsByWorkgroupIdAndStudentId(id, userId)) {
            return ResponseEntity.badRequest().body("You are already a member of this group");
        }

        GroupMembership membership = new GroupMembership();
        membership.setWorkgroup(group);
        membership.setStudentId(userId);
        membership.setStudentName(userName);
        membershipRepo.save(membership);

        return ResponseEntity.ok("Joined group successfully");
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<GroupMembership>> getMembers(@PathVariable Long id) {
        return ResponseEntity.ok(membershipRepo.findByWorkgroupId(id));
    }

    // ── Messages ────────────────────────────────────

    @PostMapping("/{id}/messages")
    public ResponseEntity<?> postMessage(@PathVariable Long id, @RequestBody GroupMessage message) {
        Workgroup group = groupRepo.findById(id).orElse(null);
        if (group == null)
            return ResponseEntity.notFound().build();

        message.setWorkgroup(group);
        GroupMessage saved = messageRepo.save(message);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<GroupMessage>> getMessages(@PathVariable Long id) {
        return ResponseEntity.ok(messageRepo.findByWorkgroupIdOrderByCreatedAtDesc(id));
    }
}
