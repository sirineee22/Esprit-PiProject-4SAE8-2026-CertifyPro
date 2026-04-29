package com.esprit.pi.jobcareers.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ApplyJobRequest {

    @NotNull(message = "L'ID de l'offre est obligatoire")
    private Long jobOfferId;

    private String coverLetter;
    private String resumeUrl;
}
