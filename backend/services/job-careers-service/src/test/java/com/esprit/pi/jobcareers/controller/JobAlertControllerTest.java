package com.esprit.pi.jobcareers.controller;

import com.esprit.pi.jobcareers.dto.response.JobAlertResponse;
import com.esprit.pi.jobcareers.model.JobAlert;
import com.esprit.pi.jobcareers.repository.JobAlertRepository;
import com.esprit.pi.jobcareers.security.jwt.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(JobAlertController.class)
class JobAlertControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockBean private JwtService          jwtService;
    @MockBean private JobAlertRepository  alertRepository;

    // ── GET /api/candidate/alerts ─────────────────────────────────────────

    @Test
    @WithMockUser(authorities = "ROLE_LEARNER")
    void shouldGetMyAlerts_returnsOk() throws Exception {
        when(alertRepository.findByUserId(any())).thenReturn(List.of());

        mockMvc.perform(get("/api/candidate/alerts")
                        .requestAttr("userId", 1L))
                .andExpect(status().isOk());
    }

    // ── POST /api/candidate/alerts ────────────────────────────────────────

    @Test
    @WithMockUser(authorities = "ROLE_LEARNER")
    void shouldCreateAlert_returnsCreated() throws Exception {
        JobAlert saved = JobAlert.builder()
                .id(1L).keyword("Java").active(true).build();

        when(alertRepository.save(any(JobAlert.class))).thenReturn(saved);

        mockMvc.perform(post("/api/candidate/alerts")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            { "keyword": "Java", "location": "Tunis" }
                            """)
                        .requestAttr("userId", 1L))
                .andExpect(status().isCreated());
    }

    // ── DELETE /api/candidate/alerts/{id} ─────────────────────────────────

    @Test
    @WithMockUser(authorities = "ROLE_LEARNER")
    void shouldDeleteAlert_returnsOk() throws Exception {
        JobAlert alert = JobAlert.builder().id(1L).userId(1L).build();
        when(alertRepository.findByIdAndUserId(eq(1L), any())).thenReturn(Optional.of(alert));

        mockMvc.perform(delete("/api/candidate/alerts/1")
                        .with(csrf())
                        .requestAttr("userId", 1L))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "ROLE_LEARNER")
    void shouldReturn404_whenAlertNotFound() throws Exception {
        when(alertRepository.findByIdAndUserId(eq(99L), any())).thenReturn(Optional.empty());

        mockMvc.perform(delete("/api/candidate/alerts/99")
                        .with(csrf())
                        .requestAttr("userId", 1L))
                .andExpect(status().isNotFound());
    }

    // ── PATCH /api/candidate/alerts/{id}/toggle ───────────────────────────

    @Test
    @WithMockUser(authorities = "ROLE_LEARNER")
    void shouldToggleAlert_returnsOk() throws Exception {
        JobAlert alert = JobAlert.builder().id(1L).userId(1L).active(true).build();
        when(alertRepository.findByIdAndUserId(eq(1L), any())).thenReturn(Optional.of(alert));
        when(alertRepository.save(any(JobAlert.class))).thenReturn(alert);

        mockMvc.perform(patch("/api/candidate/alerts/1/toggle")
                        .with(csrf())
                        .requestAttr("userId", 1L))
                .andExpect(status().isOk());
    }

    // ── Unauthorized ──────────────────────────────────────────────────────

    @Test
    void shouldReturn401_whenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/api/candidate/alerts"))
                .andExpect(status().isUnauthorized());
    }
}
