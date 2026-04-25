package com.esprit.pi.jobcareers.controller;

import com.esprit.pi.jobcareers.dto.response.CandidateResponse;
import com.esprit.pi.jobcareers.dto.response.JobApplicationResponse;
import com.esprit.pi.jobcareers.dto.response.JobOfferResponse;
import com.esprit.pi.jobcareers.security.jwt.JwtService;
import com.esprit.pi.jobcareers.service.CandidateService;
import com.esprit.pi.jobcareers.service.JobApplicationService;
import com.esprit.pi.jobcareers.service.SavedJobService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Controller uses @PreAuthorize("hasAnyAuthority('ROLE_LEARNER','ROLE_ADMIN','ROLE_USER')")
 * so we must use authorities = "ROLE_LEARNER" (not roles = "LEARNER").
 */
@WebMvcTest(CandidateJobController.class)
class CandidateJobControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockBean private JwtService            jwtService;
    @MockBean private JobApplicationService applicationService;
    @MockBean private CandidateService      candidateService;
    @MockBean private SavedJobService       savedJobService;

    // ── GET /api/candidate/profile ────────────────────────────────────────────

    @Test
    @WithMockUser(authorities = "ROLE_LEARNER")   // FIX: was roles="CANDIDATE" → 403
    void shouldGetProfile_returnsOk() throws Exception {
        when(candidateService.getCandidateByUserId(any()))
                .thenReturn(new CandidateResponse());

        mockMvc.perform(get("/api/candidate/profile")
                        .requestAttr("userId", 1L))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "ROLE_USER")
    void shouldGetProfile_asUser_returnsOk() throws Exception {
        when(candidateService.getCandidateByUserId(any()))
                .thenReturn(new CandidateResponse());

        mockMvc.perform(get("/api/candidate/profile")
                        .requestAttr("userId", 1L))
                .andExpect(status().isOk());
    }

    // ── GET /api/candidate/applications ──────────────────────────────────────

    @Test
    @WithMockUser(authorities = "ROLE_LEARNER")
    void shouldGetApplications_returnsOk() throws Exception {
        when(applicationService.getMyApplications(any(), any()))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        mockMvc.perform(get("/api/candidate/applications")
                        .requestAttr("userId", 1L))
                .andExpect(status().isOk());
    }

    // ── GET /api/candidate/saved-jobs ─────────────────────────────────────────

    @Test
    @WithMockUser(authorities = "ROLE_LEARNER")
    void shouldGetSavedJobs_returnsOk() throws Exception {
        when(savedJobService.getSavedJobs(any(), any()))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        mockMvc.perform(get("/api/candidate/saved-jobs")
                        .requestAttr("userId", 1L))
                .andExpect(status().isOk());
    }

    // ── GET /api/candidate/applications/check/{jobOfferId} ───────────────────

    @Test
    @WithMockUser(authorities = "ROLE_LEARNER")
    void shouldCheckIfApplied_returnsOk() throws Exception {
        when(applicationService.hasApplied(anyLong(), any())).thenReturn(false);

        mockMvc.perform(get("/api/candidate/applications/check/1")
                        .requestAttr("userId", 1L))
                .andExpect(status().isOk());
    }

    // ── GET /api/candidate/saved-jobs/{id}/check ─────────────────────────────

    @Test
    @WithMockUser(authorities = "ROLE_LEARNER")
    void shouldCheckIfSaved_returnsOk() throws Exception {
        when(savedJobService.isSaved(anyLong(), any())).thenReturn(false);

        mockMvc.perform(get("/api/candidate/saved-jobs/1/check")
                        .requestAttr("userId", 1L))
                .andExpect(status().isOk());
    }

    // ── Unauthorized ──────────────────────────────────────────────────────────

    @Test
    void shouldReturn401_whenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/api/candidate/profile"))
                .andExpect(status().isUnauthorized());
    }
}
