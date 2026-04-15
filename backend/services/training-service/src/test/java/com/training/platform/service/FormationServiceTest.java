package com.training.platform.service;

import com.training.platform.entity.Formation;
import com.training.platform.repository.FormationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FormationServiceTest {

    @Mock
    private FormationRepository formationRepository;

    @InjectMocks
    private FormationService formationService;

    private Formation formation;

    @BeforeEach
    void setUp() {
        formation = new Formation();
        formation.setId(1L);
        formation.setTitle("Java Spring Boot");
        formation.setDescription("Backend development with Spring Boot");
    }

    @Test
    void getAllFormations() {
        Page<Formation> page = new PageImpl<>(Arrays.asList(formation));
        when(formationRepository.findAll(any(Pageable.class))).thenReturn(page);

        Page<Formation> results = formationService.getAllFormations(PageRequest.of(0, 10));

        assertNotNull(results);
        assertEquals(1, results.getTotalElements());
        assertEquals("Java Spring Boot", results.getContent().get(0).getTitle());
        verify(formationRepository, times(1)).findAll(any(Pageable.class));
    }

    @Test
    void getFormationById() {
        when(formationRepository.findById(1L)).thenReturn(Optional.of(formation));

        Optional<Formation> result = formationService.getFormationById(1L);

        assertTrue(result.isPresent());
        assertEquals("Java Spring Boot", result.get().getTitle());
        verify(formationRepository, times(1)).findById(1L);
    }

    @Test
    void createFormation() {
        when(formationRepository.save(any(Formation.class))).thenReturn(formation);

        Formation savedFormation = formationService.createFormation(new Formation());

        assertNotNull(savedFormation);
        assertEquals("Java Spring Boot", savedFormation.getTitle());
        verify(formationRepository, times(1)).save(any(Formation.class));
    }

    @Test
    void getFormationsByTrainer() {
        when(formationRepository.findByTrainerId(1L)).thenReturn(Arrays.asList(formation));

        List<Formation> results = formationService.getFormationsByTrainer(1L);

        assertNotNull(results);
        assertEquals(1, results.size());
        verify(formationRepository, times(1)).findByTrainerId(1L);
    }

    @Test
    void deleteFormation() {
        doNothing().when(formationRepository).deleteById(1L);

        formationService.deleteFormation(1L);

        verify(formationRepository, times(1)).deleteById(1L);
    }
}
