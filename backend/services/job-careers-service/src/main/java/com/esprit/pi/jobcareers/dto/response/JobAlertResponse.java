package com.esprit.pi.jobcareers.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class JobAlertResponse {
    private Long   id;
    private String keyword;
    private String contractType;
    private String location;
    private boolean active;
    private LocalDateTime createdAt;
}
