package com.esprit.pi.jobcareers.controller;

import com.esprit.pi.jobcareers.dto.response.JobOfferResponse;
import com.esprit.pi.jobcareers.security.jwt.JwtService;
import com.esprit.pi.jobcareers.service.JobOfferService;
import com.esprit.pi.jobcareers.service.MatchingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(EmployerJobController.class)
class EmployerJobControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean private JwtService      jwtService;
    @MockBean private JobOfferService jobOfferService;
    @MockBean private MatchingService matchingService;   // ← FIX: was missing

    // ── GET /api/employer/jobs ────────────────────────────────────────────────

    @Test
    @WithMockUser(authorities = "ROLE_EMPLOYER")
    void shouldGetEmployerJobs_returnsOk() throws Exception {
        when(jobOfferService.getMyPostedOffersPaged(any(), anyInt(), anyInt()))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        mockMvc.perform(get("/api/employer/jobs"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void shouldGetEmployerJobs_asAdmin_returnsOk() throws Exception {
        when(jobOfferService.getMyPostedOffersPaged(any(), anyInt(), anyInt()))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        mockMvc.perform(get("/api/employer/jobs"))
                .andExpect(status().isOk());
    }

    // ── DELETE /api/employer/jobs/{id} ────────────────────────────────────────

    @Test
    @WithMockUser(authorities = "ROLE_EMPLOYER")
    void shouldDeleteJob_returnsOk() throws Exception {
        mockMvc.perform(delete("/api/employer/jobs/1").with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void shouldDeleteJob_asAdmin_returnsOk() throws Exception {
        mockMvc.perform(delete("/api/employer/jobs/1").with(csrf()))
                .andExpect(status().isOk());
    }

    // ── GET /api/employer/jobs/{id}/matching-candidates ───────────────────────

    @Test
    @WithMockUser(authorities = "ROLE_EMPLOYER")
    void shouldGetMatchingCandidates_returnsOk() throws Exception {
        when(matchingService.getMatchingCandidates(anyLong(), anyInt()))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/employer/jobs/1/matching-candidates"))
                .andExpect(status().isOk());
    }

    // ── Unauthorized access ───────────────────────────────────────────────────

    @Test
    void shouldReturn401_whenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/api/employer/jobs"))
                .andExpect(status().isUnauthorized());
    }
}
