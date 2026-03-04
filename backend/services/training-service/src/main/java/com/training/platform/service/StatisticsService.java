package com.training.platform.service;

import com.training.platform.dto.StatsDTO;
import com.training.platform.entity.Evaluation;
import com.training.platform.entity.Formation;
import com.training.platform.entity.QuizAttempt;
import com.training.platform.repository.EvaluationRepository;
import com.training.platform.repository.FormationRepository;
import com.training.platform.repository.QuizAttemptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatisticsService {

        private final EvaluationRepository evaluationRepository;
        private final QuizAttemptRepository quizAttemptRepository;
        private final FormationRepository formationRepository;

        private static final double SUCCESS_THRESHOLD = 50.0;

        public StatsDTO getTrainerStats(Long trainerId) {
                System.out.println("Starting stats calculation for trainer: " + trainerId);

                // 1. Fetch all data sources
                List<Formation> formations = formationRepository.findByTrainerId(trainerId);
                System.out.println("Formations found: " + formations.size());

                List<Evaluation> evaluations = evaluationRepository.findByTrainerId(trainerId);
                System.out.println("Evaluations found: " + evaluations.size());

                List<QuizAttempt> quizAttempts = quizAttemptRepository.findByTrainerId(trainerId);
                System.out.println("QuizAttempts found: " + quizAttempts.size());

                // 2. Aggregate student IDs for global count
                Set<Long> allStudentIds = new HashSet<>();
                evaluations.forEach(e -> {
                        if (e.getStudent() != null)
                                allStudentIds.add(e.getStudent().getId());
                });
                quizAttempts.forEach(a -> {
                        if (a.getStudent() != null)
                                allStudentIds.add(a.getStudent().getId());
                });

                // 3. Combine scores for global average
                List<Double> allScores = new ArrayList<>();
                evaluations.forEach(e -> allScores.add(e.getScore()));
                quizAttempts.forEach(a -> allScores.add(a.getScore()));

                System.out.println("Total distinct students: " + allStudentIds.size());
                System.out.println("Total scores collected: " + allScores.size());

                double averageScore = allScores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
                long successfulEvals = allScores.stream().filter(s -> s >= SUCCESS_THRESHOLD).count();
                double successRate = allScores.isEmpty() ? 0.0 : (double) successfulEvals / allScores.size() * 100.0;

                // 4. Build per-formation stats
                List<StatsDTO.FormationStatsDTO> formationStats = formations.stream().map(f -> {
                        List<Double> fScores = new ArrayList<>();
                        Set<Long> fStudents = new HashSet<>();

                        // Filter evaluations for this formation
                        evaluations.stream()
                                        .filter(e -> e.getFormation() != null
                                                        && e.getFormation().getId().equals(f.getId()))
                                        .forEach(e -> {
                                                fScores.add(e.getScore());
                                                fStudents.add(e.getStudent().getId());
                                        });

                        // Filter quiz attempts for this formation
                        quizAttempts.stream()
                                        .filter(a -> a.getQuiz() != null && a.getQuiz().getFormation() != null
                                                        && a.getQuiz().getFormation().getId().equals(f.getId()))
                                        .forEach(a -> {
                                                fScores.add(a.getScore());
                                                fStudents.add(a.getStudent().getId());
                                        });

                        double fAvg = fScores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
                        long fSuccessCount = fScores.stream().filter(s -> s >= SUCCESS_THRESHOLD).count();
                        double fSuccessRate = fScores.isEmpty() ? 0.0 : (double) fSuccessCount / fScores.size() * 100.0;

                        return StatsDTO.FormationStatsDTO.builder()
                                        .formationId(f.getId())
                                        .formationTitle(f.getTitle())
                                        .studentCount(fStudents.size())
                                        .averageScore(Math.round(fAvg * 100.0) / 100.0)
                                        .successRate(Math.round(fSuccessRate * 100.0) / 100.0)
                                        .build();
                }).collect(Collectors.toList());

                System.out.println("Stats calculation completed for trainer: " + trainerId);

                return StatsDTO.builder()
                                .totalStudents(allStudentIds.size())
                                .totalEvaluations(allScores.size())
                                .averageScore(Math.round(averageScore * 100.0) / 100.0)
                                .successRate(Math.round(successRate * 100.0) / 100.0)
                                .formationStats(formationStats)
                                .build();
        }
}
