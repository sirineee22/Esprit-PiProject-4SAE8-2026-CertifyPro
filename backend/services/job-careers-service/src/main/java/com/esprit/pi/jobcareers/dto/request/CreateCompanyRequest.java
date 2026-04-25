package com.esprit.pi.jobcareers.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDate;

@Data
public class CreateCompanyRequest {
    @NotBlank(message = "Le nom est obligatoire")
    private String name;
    private String logo;
    private String description;
    private String industryType;
    private String location;
    private String country;
    private Integer employeeMin;
    private Integer employeeMax;
    private String website;
    @Email private String contactEmail;
    private String phone;
    private LocalDate foundedIn;
    private String department;
    private String linkedinUrl;
    private String twitterUrl;
    private String facebookUrl;
    private Long userId; // 🔥 IMPORTANT ADD THIS

}