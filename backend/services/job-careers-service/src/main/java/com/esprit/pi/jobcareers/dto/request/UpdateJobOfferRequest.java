package com.esprit.pi.jobcareers.dto.request;

import com.esprit.pi.jobcareers.enums.ContractType;
import com.esprit.pi.jobcareers.enums.ExperienceLevel;
import com.esprit.pi.jobcareers.enums.JobStatus;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class UpdateJobOfferRequest {
    private String title;
    private String position;
    private String description;
    private ContractType contractType;
    private ExperienceLevel experienceLevel;
    private JobStatus status;
    private Integer numberOfVacancy;
    private Double startSalary;
    private Double lastSalary;
    private String country;
    private String state;
    private String location;
    private LocalDate lastDateToApply;
    private LocalDate closeDate;
    private List<String> tags;
    private Boolean isUrgent;
    private Boolean isRemote;
    private Boolean isPrivate;
    private Boolean isFeatured;
    private Long companyId;
    private Long categoryId;
}