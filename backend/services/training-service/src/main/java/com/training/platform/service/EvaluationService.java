package com.training.platform.service;

import com.training.platform.entity.Evaluation;
import com.training.platform.repository.EvaluationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EvaluationService {
    private final EvaluationRepository evaluationRepository;

    public List<Evaluation> getAllEvaluations() {
        return evaluationRepository.findAll();
    }

    public Optional<Evaluation> getEvaluationById(Long id) {
        return evaluationRepository.findById(id);
    }

    public Evaluation createEvaluation(Evaluation evaluation) {
        return evaluationRepository.save(evaluation);
    }

    public List<Evaluation> getEvaluationsByStudent(Long studentId) {
        return evaluationRepository.findByStudentId(studentId);
    }

    public List<Evaluation> getEvaluationsByFormation(Long formationId) {
        return evaluationRepository.findByFormationId(formationId);
    }

    public void deleteEvaluation(Long id) {
        evaluationRepository.deleteById(id);
    }
}
