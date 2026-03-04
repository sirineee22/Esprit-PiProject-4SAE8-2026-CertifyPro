package com.training.platform.service;

import com.training.platform.entity.Evaluation;
import com.training.platform.entity.EvaluationType;
import com.training.platform.repository.EvaluationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EvaluationServiceTest {

    @Mock
    private EvaluationRepository evaluationRepository;

    @InjectMocks
    private EvaluationService evaluationService;

    private Evaluation evaluation;

    @BeforeEach
    void setUp() {
        evaluation = new Evaluation();
        evaluation.setId(1L);
        evaluation.setType(EvaluationType.QUIZ);
        evaluation.setScore(85.0);
        evaluation.setRemarks("Good job!");
    }

    @Test
    void getAllEvaluations() {
        when(evaluationRepository.findAll()).thenReturn(Arrays.asList(evaluation));

        List<Evaluation> results = evaluationService.getAllEvaluations();

        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals(EvaluationType.QUIZ, results.get(0).getType());
        verify(evaluationRepository, times(1)).findAll();
    }

    @Test
    void getEvaluationById() {
        when(evaluationRepository.findById(1L)).thenReturn(Optional.of(evaluation));

        Optional<Evaluation> result = evaluationService.getEvaluationById(1L);

        assertTrue(result.isPresent());
        assertEquals(85.0, result.get().getScore());
        verify(evaluationRepository, times(1)).findById(1L);
    }

    @Test
    void createEvaluation() {
        when(evaluationRepository.save(any(Evaluation.class))).thenReturn(evaluation);

        Evaluation savedEvaluation = evaluationService.createEvaluation(new Evaluation());

        assertNotNull(savedEvaluation);
        assertEquals("Good job!", savedEvaluation.getRemarks());
        verify(evaluationRepository, times(1)).save(any(Evaluation.class));
    }

    @Test
    void getEvaluationsByStudent() {
        when(evaluationRepository.findByStudentId(1L)).thenReturn(Arrays.asList(evaluation));

        List<Evaluation> results = evaluationService.getEvaluationsByStudent(1L);

        assertNotNull(results);
        assertEquals(1, results.size());
        verify(evaluationRepository, times(1)).findByStudentId(1L);
    }

    @Test
    void getEvaluationsByFormation() {
        when(evaluationRepository.findByFormationId(1L)).thenReturn(Arrays.asList(evaluation));

        List<Evaluation> results = evaluationService.getEvaluationsByFormation(1L);

        assertNotNull(results);
        assertEquals(1, results.size());
        verify(evaluationRepository, times(1)).findByFormationId(1L);
    }

    @Test
    void deleteEvaluation() {
        doNothing().when(evaluationRepository).deleteById(1L);

        evaluationService.deleteEvaluation(1L);

        verify(evaluationRepository, times(1)).deleteById(1L);
    }
}
