package com.esprit.pi.jobcareers.dto.response;

import lombok.Data;

@Data
public class JobCategoryResponse {
    private Long id;
    private String name;
    private String icon;
    private String description;
    private int positionCount;
}