package com.training.platform.controller;

import com.training.platform.entity.Role;
import com.training.platform.entity.User;
import com.training.platform.repository.UserRepository;
import com.training.platform.security.JwtUtil;
import com.training.platform.service.TwoFactorService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final TwoFactorService twoFactorService;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil, TwoFactorService twoFactorService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.twoFactorService = twoFactorService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
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

            // Check if 2FA is enabled
            if (user.isTwoFactorEnabled()) {
                log.info("Login: MFA Required for email={}", email);
                return ResponseEntity.ok(java.util.Map.of(
                    "mfaRequired", true,
                    "email", email
                ));
            }

            return finalizeLogin(user);
        } catch (Exception e) {
            log.error("Login 500 for email={}", request != null ? request.email : "?", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Login failed. Please try again.");
        }
    }

    @PostMapping("/verify-2fa")
    public ResponseEntity<?> verify2fa(@Valid @RequestBody Verify2faRequest request) {
        try {
            String email = request.email.trim().toLowerCase();
            Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }
            User user = userOpt.get();
            
            if (!twoFactorService.isCodeValid(user.getTwoFactorSecret(), request.code)) {
                log.warn("MFA 401: Invalid code for email={}", email);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Code invalide");
            }

            return finalizeLogin(user);
        } catch (Exception e) {
            log.error("verify2fa 500", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private ResponseEntity<?> finalizeLogin(User user) {
        user.setLastLogin(java.time.Instant.now());
        user.setLastActivityAt(java.time.Instant.now());
        userRepository.save(user);

        String token = jwtUtil.generateToken(
                user.getEmail(),
                user.getId(),
                user.getRole().getName()
        );
        log.info("Login OK for email={}", user.getEmail());
        return ResponseEntity.ok(LoginResponse.from(user, token));
    }

    static class LoginRequest {
        @NotBlank
        @Email
        public String email;

        @NotBlank
        public String password;
    }

    static class Verify2faRequest {
        @NotBlank
        @Email
        public String email;

        @NotBlank
        public String code;
    }

    static class LoginResponse {
        public String token;
        public UserData user;
        public boolean mfaRequired = false;

        static class UserData {
            public Long id;
            public String firstName;
            public String lastName;
            public String email;
            public String phoneNumber;
            public boolean active;
            public Role role;
            public boolean isTwoFactorEnabled;
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
            response.user.role = user.getRole();
            response.user.isTwoFactorEnabled = user.isTwoFactorEnabled();
            return response;
        }
    }
}
