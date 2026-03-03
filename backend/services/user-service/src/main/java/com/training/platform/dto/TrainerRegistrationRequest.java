package com.training.platform.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TrainerRegistrationRequest {
    @NotBlank
    @Size(min = 2, max = 50)
    private String firstName;

    @NotBlank
    @Size(min = 2, max = 50)
    private String lastName;

    @NotBlank
    @Email
    @Size(max = 50)
    private String email;

    @NotBlank
    @Size(min = 8, max = 120)
    private String password;

    private String phoneNumber;

    @NotBlank
    private String subjects;

    @NotBlank
    private String experience;

    private String certificatesLink;

    @NotBlank
    @Size(min = 20)
    private String message;
}
