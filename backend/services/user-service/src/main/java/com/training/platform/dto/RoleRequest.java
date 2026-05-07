package com.training.platform.dto;

import jakarta.validation.constraints.NotBlank;

public class RoleRequest {

    @NotBlank
    public String name;
}
