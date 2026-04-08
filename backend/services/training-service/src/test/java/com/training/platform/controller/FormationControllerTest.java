package com.training.platform.controller;

import com.training.platform.client.UserClient;
import com.training.platform.client.UserDTO;
import com.training.platform.entity.Formation;
import com.training.platform.entity.TrainingType;
import com.training.platform.security.JwtUtil;
import com.training.platform.service.FormationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(FormationController.class)
@AutoConfigureMockMvc(addFilters = false) // Disable security filters for simple controller testing
public class FormationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FormationService formationService;

    @MockBean
    private UserClient userClient;
    
    @MockBean
    private JwtUtil jwtUtil; // Required by SecurityConfig

    private Formation formation;

    @BeforeEach
    void setUp() {
        formation = new Formation();
        formation.setId(1L);
        formation.setTitle("Integration Testing");
        formation.setDescription("Learn Spring Boot Testing");
        formation.setLevel("Beginner");
        formation.setDuration("10h");
        formation.setTrainingType(TrainingType.VIDEO);
        formation.setTrainerId(5L);
    }

    @Test
    void testGetFormationById() throws Exception {
        Mockito.when(formationService.getFormationById(1L)).thenReturn(Optional.of(formation));

        UserDTO mockTrainer = new UserDTO();
        mockTrainer.setId(5L);
        mockTrainer.setFirstName("John");
        mockTrainer.setLastName("Doe");
        Mockito.when(userClient.getUserById(5L)).thenReturn(mockTrainer);

        mockMvc.perform(get("/api/formations/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Integration Testing"))
                .andExpect(jsonPath("$.trainer.firstName").value("John"));
    }

    @Test
    void testGetAllFormations() throws Exception {
        Page<Formation> formationPage = new PageImpl<>(List.of(formation));
        Mockito.when(formationService.getAllFormations(any(Pageable.class))).thenReturn(formationPage);

        mockMvc.perform(get("/api/formations?page=0&size=10")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("Integration Testing"));
    }
}
