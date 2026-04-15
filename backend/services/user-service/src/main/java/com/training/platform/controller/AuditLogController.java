package com.training.platform.controller;

import com.training.platform.entity.AuditLog;
import com.training.platform.repository.AuditLogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/audit")
@CrossOrigin(origins = "*")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    public AuditLogController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping
    public ResponseEntity<List<AuditLog>> getAuditLogs() {
        return ResponseEntity.ok(auditLogRepository.findAllByOrderByCreatedAtDesc());
    }

    @PostMapping
    public ResponseEntity<AuditLog> addLog(@RequestBody AuditLog log) {
        return ResponseEntity.ok(auditLogRepository.save(log));
    }
}
