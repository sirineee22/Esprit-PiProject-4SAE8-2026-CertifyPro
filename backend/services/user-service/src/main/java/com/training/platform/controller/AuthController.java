package com.training.platform.controller;

import com.training.platform.entity.Role;
import com.training.platform.entity.User;
import com.training.platform.repository.UserRepository;
import com.training.platform.security.JwtUtil;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

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

        return userRepository.findByEmail(request.email)
                .filter(user -> passwordEncoder.matches(request.password, user.getPassword()))
                .<ResponseEntity<?>>map(user -> {
                    String token = jwtUtil.generateToken(
                        user.getEmail(), 
                        user.getId(), 
                        user.getRole().getName()
                    );
                    return ResponseEntity.ok(LoginResponse.from(user, token));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials"));
    }

    static class LoginRequest {
        @NotBlank
        @Email
        public String email;

        @NotBlank
        public String password;
    }

    static class LoginResponse {
        public String token;
        public UserData user;

        static class UserData {
            public Long id;
            public String firstName;
            public String lastName;
            public String email;
            public String phoneNumber;
            public boolean active;
            public Role role;
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
            return response;
        }
    }
}
