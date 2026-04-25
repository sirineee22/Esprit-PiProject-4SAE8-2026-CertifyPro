package com.esprit.pi.jobcareers.controller;

import com.esprit.pi.jobcareers.security.jwt.JwtService;
import com.esprit.pi.jobcareers.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminJobController.class)
class AdminJobControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean private JwtService jwtService;
    @MockBean private JobApplicationService applicationService;
    @MockBean private CandidateService candidateService;
    @MockBean private StatisticsService statisticsService;
    @MockBean private CompanyService companyService;

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldGetApplications() throws Exception {
        mockMvc.perform(get("/api/admin/applications"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldGetDashboard() throws Exception {
        mockMvc.perform(get("/api/admin/statistics/dashboard"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldGetCompanies() throws Exception {
        mockMvc.perform(get("/api/admin/companies"))
                .andExpect(status().isOk());
    }
}