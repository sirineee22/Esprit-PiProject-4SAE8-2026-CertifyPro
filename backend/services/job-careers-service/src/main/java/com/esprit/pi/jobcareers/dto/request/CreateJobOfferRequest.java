package com.esprit.pi.jobcareers.dto.request;

import com.esprit.pi.jobcareers.enums.ContractType;
import com.esprit.pi.jobcareers.enums.ExperienceLevel;
import com.esprit.pi.jobcareers.enums.JobStatus;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class CreateJobOfferRequest {
    @NotBlank(message = "Le titre est obligatoire")
    private String title;

    @JsonAlias("jobPosition")
    private String position;

    private String description;

    @NotNull(message = "Le type de contrat est obligatoire")
    @JsonAlias("jobType")
    private ContractType contractType;

    private ExperienceLevel experienceLevel;

    @JsonAlias("vacancyCount")
    private Integer numberOfVacancy;

    @JsonAlias("salaryStart")
    private Double startSalary;

    @JsonAlias("salaryEnd")
    private Double lastSalary;

    private String country;
    private String state;
    private String location;

    @JsonAlias("lastApplyDate")
    private LocalDate lastDateToApply;

    private LocalDate closeDate;
    private List<String> tags;
    private Boolean isUrgent;
    private Boolean isRemote;
    private Boolean isPrivate;
    private Boolean isFeatured;

    private JobStatus status;

    private Long companyId;

    private Long categoryId;
}
