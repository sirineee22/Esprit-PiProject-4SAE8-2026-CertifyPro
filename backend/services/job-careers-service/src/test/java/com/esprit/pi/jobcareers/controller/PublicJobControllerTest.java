package com.esprit.pi.jobcareers.controller;

import com.esprit.pi.jobcareers.security.jwt.JwtService;
import com.esprit.pi.jobcareers.service.JobOfferService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PublicJobController.class)
class PublicJobControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockBean private JwtService jwtService;
    @MockBean private JobOfferService jobOfferService;

    @Test
    @WithMockUser
        // ← هذا هو الحل
    void shouldGetPublicJobs() throws Exception {
        mockMvc.perform(get("/api/jobs"))
                .andExpect(status().isOk());
    }
}