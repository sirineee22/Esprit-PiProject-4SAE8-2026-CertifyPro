package com.esprit.pi.jobcareers.security.jwt;

import lombok.Data;

@Data
public class JwtClaims {
    private Long userId;
    private String username;
    private String role;
}