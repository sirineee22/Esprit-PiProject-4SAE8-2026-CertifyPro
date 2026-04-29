package com.esprit.pi.jobcareers.dto.response;

import com.esprit.pi.jobcareers.enums.ContractType;
import com.esprit.pi.jobcareers.enums.ExperienceLevel;
import com.esprit.pi.jobcareers.enums.JobStatus;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class JobOfferResponse {
    private Long id;
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
    private LocalDate postDate;
    private List<String> tags;
    private Boolean isUrgent;
    private Boolean isRemote;
    private Boolean isPrivate;
    private Boolean isFeatured;
    private Integer applicationCount;
    private CompanyResponse company;
    private JobCategoryResponse category;
    private LocalDateTime createdAt;
    private Boolean expired;

}