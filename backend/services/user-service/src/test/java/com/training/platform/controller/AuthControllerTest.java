package com.training.platform.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.training.platform.entity.Role;
import com.training.platform.entity.User;
import com.training.platform.repository.UserRepository;
import com.training.platform.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @MockBean
    private JwtUtil jwtUtil;

    @Autowired
    private ObjectMapper objectMapper;

    private User user;
    private Role role;

    @BeforeEach
    void setUp() {
        role = new Role();
        role.setId(1L);
        role.setName("TRAINER");

        user = new User();
        user.setId(1L);
        user.setEmail("khalil@esprit.tn");
        user.setPassword("encodedPassword");
        user.setRole(role);
        user.setActive(true);
    }

    @Test
    void login_WithCorrectCredentials_ShouldReturnToken() throws Exception {
        AuthController.LoginRequest loginRequest = new AuthController.LoginRequest();
        loginRequest.email = "khalil@esprit.tn";
        loginRequest.password = "password123";

        when(userRepository.findByEmailIgnoreCase("khalil@esprit.tn")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);
        when(jwtUtil.generateToken("khalil@esprit.tn", 1L, "TRAINER")).thenReturn("fake-jwt-token");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("fake-jwt-token"))
                .andExpect(jsonPath("$.user.email").value("khalil@esprit.tn"));
    }

    @Test
    void login_WithWrongPassword_ShouldReturn401() throws Exception {
        AuthController.LoginRequest loginRequest = new AuthController.LoginRequest();
        loginRequest.email = "khalil@esprit.tn";
        loginRequest.password = "wrongpass";

        when(userRepository.findByEmailIgnoreCase("khalil@esprit.tn")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpass", "encodedPassword")).thenReturn(false);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_WithNonExistentUser_ShouldReturn401() throws Exception {
        AuthController.LoginRequest loginRequest = new AuthController.LoginRequest();
        loginRequest.email = "unknown@esprit.tn";
        loginRequest.password = "password123";

        when(userRepository.findByEmailIgnoreCase("unknown@esprit.tn")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }
}
