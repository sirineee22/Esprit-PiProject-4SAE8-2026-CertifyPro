package com.training.platform.dto;

import jakarta.validation.constraints.NotBlank;

public class AuditLogRequest {

    @NotBlank
    public String action;

    public Long actorId;
    public String actorEmail;
    public String targetType;
    public String targetId;
    public String details;
}
