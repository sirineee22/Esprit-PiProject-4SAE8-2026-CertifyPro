package com.esprit.pi.jobcareers.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class CandidateResponse {
    private Long id;
    private Long userId;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String phone;
    private String profilePicture;
    private String jobTitle;
    private String location;
    private String country;
    private String bio;
    private String resumeUrl;
    private String linkedinUrl;
    private String portfolioUrl;
    private Double rating;
    private Long ratingCount;
    private List<String> skills;
    private List<String> certifications;
    private LocalDateTime createdAt;
}