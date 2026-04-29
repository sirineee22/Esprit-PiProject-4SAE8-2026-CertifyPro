package com.training.platform.dto;

import com.training.platform.entity.TrainingType;
import com.training.platform.client.UserDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FormationDTO {
    private Long id;
    private String title;
    private String description;
    private String level;
    private String duration;
    private TrainingType trainingType;
    private String contentUrl;
    private Long trainerId;
    private UserDTO trainer;
}
