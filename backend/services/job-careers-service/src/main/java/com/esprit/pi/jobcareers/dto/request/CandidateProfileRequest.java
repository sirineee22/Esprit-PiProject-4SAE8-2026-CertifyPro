package com.esprit.pi.jobcareers.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;

@Data
public class CandidateProfileRequest {
    @NotBlank(message = "Prénom obligatoire")
    private String firstName;
    @NotBlank(message = "Nom obligatoire")
    private String lastName;
    private String phone;
    private String profilePicture;
    private String jobTitle;
    private String location;
    private String country;
    private String bio;
    private String resumeUrl;
    private String linkedinUrl;
    private String portfolioUrl;
    private List<String> skills;
    private List<String> certifications;
}