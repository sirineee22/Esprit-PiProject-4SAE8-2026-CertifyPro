package com.esprit.pi.jobcareers.dto.request;

import lombok.Data;

@Data
public class CreateJobAlertRequest {
    private String keyword;
    private String contractType;
    private String location;
}
