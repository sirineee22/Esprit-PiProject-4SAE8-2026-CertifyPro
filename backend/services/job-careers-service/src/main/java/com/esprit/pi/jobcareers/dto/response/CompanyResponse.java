package com.esprit.pi.jobcareers.dto.response;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class CompanyResponse {
    private Long id;
    private String name;
    private String logo;
    private String description;
    private String industryType;
    private String location;
    private String country;
    private Integer employeeMin;
    private Integer employeeMax;
    private String website;
    private String contactEmail;
    private String phone;
    private Double rating;
    private LocalDate foundedIn;
    private Integer vacancyCount;
    private String department;
    private String linkedinUrl;
    private String twitterUrl;
    private String facebookUrl;
    private LocalDateTime createdAt;
}