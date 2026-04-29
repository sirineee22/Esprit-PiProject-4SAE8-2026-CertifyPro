package com.training.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiFeedbackRequestDTO {
    private Double score;
    private String formationTitle;
    private String shortKeywords; // e.g: "effort louable, manque d'architecture"
}
