package com.esprit.pi.jobcareers.dto.request;

import com.esprit.pi.jobcareers.enums.ApplicationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UpdateApplicationStatusRequest {
    @NotNull(message = "Le statut est obligatoire")
    private ApplicationStatus status;
    private String        recruiterNotes;
    // ── Interview scheduling ──────────────────────────────────
    private LocalDateTime interviewDate;
    private String        interviewLink;
    private String        interviewNotes;
}