package com.training.platform.controller;

import com.training.platform.entity.User;
import com.training.platform.repository.UserRepository;
import com.training.platform.security.JwtUtil;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request == null || request.email == null || request.password == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email and password are required");
        }

        try {
            String email = request.email.trim().toLowerCase();
            Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email);
            if (userOpt.isEmpty()) {
                log.warn("Login 401: no user found for email={}", email);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
            }
            User user = userOpt.get();
            if (!passwordEncoder.matches(request.password, user.getPassword())) {
                log.warn("Login 401: wrong password for email={}", email);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
            }
            if (user.getRole() == null) {
                log.error("Login 500: user role is null for email={}", email);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("User role not set. Please contact support.");
            }
            String token = jwtUtil.generateToken(
                    user.getEmail(),
                    user.getId(),
                    user.getRole().getName());
            log.info("Login OK for email={}", email);
            return ResponseEntity.ok(LoginResponse.from(user, token));
        } catch (Exception e) {
            log.error("CRITICAL: Login 500 for email={} - Exception: {}",
                    request != null ? request.email : "?", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Login failed. Please try again.");
        }
    }

    static class LoginRequest {
        @NotBlank
        @Email
        public String email;

        @NotBlank
        public String password;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    static class LoginResponse {
        public String token;
        public UserData user;

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        static class UserData {
            public Long id;
            public String firstName;
            public String lastName;
            public String email;
            public String phoneNumber;
            public boolean active;
            public RoleDTO role;
        }

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        static class RoleDTO {
            public Long id;
            public String name;
        }

        static LoginResponse from(User user, String token) {
            LoginResponse response = new LoginResponse();
            response.token = token;
            response.user = new UserData();
            response.user.id = user.getId();
            response.user.firstName = user.getFirstName();
            response.user.lastName = user.getLastName();
            response.user.email = user.getEmail();
            response.user.phoneNumber = user.getPhoneNumber();
            response.user.active = user.isActive();
            if (user.getRole() != null) {
                response.user.role = new RoleDTO();
                response.user.role.id = user.getRole().getId();
                response.user.role.name = user.getRole().getName();
            }
            return response;
        }
    }
}
