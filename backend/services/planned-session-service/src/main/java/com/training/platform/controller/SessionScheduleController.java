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

    @Autowired
    private com.training.platform.service.PdfExportService pdfExportService;

    @Autowired
    private com.training.platform.service.CalendarExportService calendarExportService;

    @Autowired
    private com.training.platform.service.QrCodeGeneratorService qrCodeGeneratorService;

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

    @GetMapping("/trainer/{trainerId}/export/pdf")
    public ResponseEntity<byte[]> exportSchedulePdf(@PathVariable Long trainerId) {
        byte[] pdfBytes = pdfExportService.generateTrainerSchedulePdf(trainerId);

        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("filename", "schedule.pdf");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    @GetMapping("/trainer/{trainerId}/export/ics")
    public ResponseEntity<String> exportScheduleIcs(@PathVariable Long trainerId) {
        String icsContent = calendarExportService.generateTrainerScheduleIcs(trainerId);

        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.parseMediaType("text/calendar"));
        headers.set("Content-Disposition", "attachment; filename=\"schedule.ics\"");

        return new ResponseEntity<>(icsContent, headers, HttpStatus.OK);
    }

    @GetMapping("/trainer/{trainerId}/export/qr")
    public ResponseEntity<byte[]> getCalendarQrCode(@PathVariable Long trainerId,
            jakarta.servlet.http.HttpServletRequest request) {
        String requestUrl = request.getRequestURL().toString();
        String icsUrl = requestUrl.replace("/export/qr", "/export/ics");

        byte[] qrImage = qrCodeGeneratorService.generateQrCodeImage(icsUrl, 300, 300);

        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.IMAGE_PNG);

        return new ResponseEntity<>(qrImage, headers, HttpStatus.OK);
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
    public ResponseEntity<SessionSchedule> updateSchedule(@PathVariable Long id,
            @RequestBody SessionSchedule schedule) {
        try {
            return ResponseEntity.ok(service.updateSchedule(id, schedule));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody String status) {
        try {
            // Remove quotes if present from raw string body
            String statusValue = status.replace("\"", "");
            com.training.platform.entity.SessionStatus newStatus = com.training.platform.entity.SessionStatus
                    .valueOf(statusValue.toUpperCase());
            return ResponseEntity.ok(service.updateSessionStatus(id, newStatus));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
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
