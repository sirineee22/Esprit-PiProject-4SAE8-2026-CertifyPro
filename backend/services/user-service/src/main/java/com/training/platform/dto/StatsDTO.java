package com.training.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatsDTO {
    private long totalStudents;
    private long totalEvaluations;
    private double averageScore;
    private double successRate; // Percentage of scores above a threshold
    private List<FormationStatsDTO> formationStats;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FormationStatsDTO {
        private Long formationId;
        private String formationTitle;
        private long studentCount;
        private double averageScore;
        private double successRate;
    }
}
