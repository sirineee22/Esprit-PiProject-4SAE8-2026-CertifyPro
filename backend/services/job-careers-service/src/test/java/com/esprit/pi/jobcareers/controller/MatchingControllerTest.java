package com.esprit.pi.jobcareers.controller;

import com.esprit.pi.jobcareers.dto.response.JobMatchResponse;
import com.esprit.pi.jobcareers.security.jwt.JwtService;
import com.esprit.pi.jobcareers.service.MatchingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MatchingController.class)
class MatchingControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockBean private JwtService     jwtService;
    @MockBean private MatchingService matchingService;

    // ── GET /api/candidate/matching/recommendations ───────────────────────

    @Test
    @WithMockUser(authorities = "ROLE_LEARNER")
    void shouldGetRecommendations_returnsOk() throws Exception {
        when(matchingService.getRecommendations(any(), anyInt()))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/candidate/matching/recommendations")
                        .requestAttr("userId", 1L))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "ROLE_LEARNER")
    void shouldGetRecommendations_withFilters_returnsOk() throws Exception {
        JobMatchResponse match = JobMatchResponse.builder()
                .matchScore(80).contractType("FULL_TIME").country("Tunisia").isRemote(false).build();

        when(matchingService.getRecommendations(any(), anyInt()))
                .thenReturn(List.of(match));

        mockMvc.perform(get("/api/candidate/matching/recommendations")
                        .param("limit", "5")
                        .param("contractType", "FULL_TIME")
                        .param("country", "Tunisia")
                        .param("minScore", "50")
                        .requestAttr("userId", 1L))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "ROLE_LEARNER")
    void shouldFilterByMinScore() throws Exception {
        JobMatchResponse low  = JobMatchResponse.builder().matchScore(30).build();
        JobMatchResponse high = JobMatchResponse.builder().matchScore(85).build();

        when(matchingService.getRecommendations(any(), anyInt()))
                .thenReturn(List.of(low, high));

        mockMvc.perform(get("/api/candidate/matching/recommendations")
                        .param("minScore", "50")
                        .requestAttr("userId", 1L))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "ROLE_LEARNER")
    void shouldFilterRemoteOnly() throws Exception {
        JobMatchResponse remote = JobMatchResponse.builder()
                .matchScore(70).isRemote(true).build();

        when(matchingService.getRecommendations(any(), anyInt()))
                .thenReturn(List.of(remote));

        mockMvc.perform(get("/api/candidate/matching/recommendations")
                        .param("remoteOnly", "true")
                        .requestAttr("userId", 1L))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "ROLE_USER")
    void shouldGetRecommendations_asUser_returnsOk() throws Exception {
        when(matchingService.getRecommendations(any(), anyInt()))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/candidate/matching/recommendations")
                        .requestAttr("userId", 2L))
                .andExpect(status().isOk());
    }

    // ── Unauthorized ──────────────────────────────────────────────────────

    @Test
    void shouldReturn401_whenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/api/candidate/matching/recommendations"))
                .andExpect(status().isUnauthorized());
    }
}
