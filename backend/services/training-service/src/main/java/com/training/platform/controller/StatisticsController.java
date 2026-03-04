package com.training.platform.controller;

import com.training.platform.dto.StatsDTO;
import com.training.platform.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping("/trainer/{trainerId}")
    public ResponseEntity<StatsDTO> getTrainerStats(@PathVariable(name = "trainerId") Long trainerId) {
        System.out.println("Fetching stats for trainer: " + trainerId);
        return ResponseEntity.ok(statisticsService.getTrainerStats(trainerId));
    }
}
