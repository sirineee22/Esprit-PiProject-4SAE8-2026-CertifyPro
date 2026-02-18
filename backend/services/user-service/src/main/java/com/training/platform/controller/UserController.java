package com.training.platform.controller;

import com.training.platform.entity.User;
import com.training.platform.repository.RoleRepository;
import com.training.platform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createUser(@Valid @RequestBody User user) {
        String email = user.getEmail() != null ? user.getEmail().trim().toLowerCase() : null;
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body("Email is required");
        }
        user.setEmail(email);
        if (userRepository.existsByEmailIgnoreCase(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already exists");
        }
        try {
            // Hash password before saving
            user.setPassword(passwordEncoder.encode(user.getPassword()));

            // Assign default LEARNER role if no role provided
            if (user.getRole() == null) {
                user.setRole(roleRepository.findByName("LEARNER")
                    .orElseThrow(() -> new RuntimeException("Default role LEARNER not found")));
            }

            return ResponseEntity.ok(userRepository.save(user));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already exists");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        return userRepository.findById(id)
                .map(user -> {
                    if (userDetails.getFirstName() != null && !userDetails.getFirstName().isBlank()) {
                        user.setFirstName(userDetails.getFirstName());
                    }
                    if (userDetails.getLastName() != null && !userDetails.getLastName().isBlank()) {
                        user.setLastName(userDetails.getLastName());
                    }
                    if (userDetails.getEmail() != null && !userDetails.getEmail().isBlank()) {
                        user.setEmail(userDetails.getEmail());
                    }
                    if (userDetails.getPhoneNumber() != null) {
                        user.setPhoneNumber(userDetails.getPhoneNumber());
                    }
                    user.setActive(userDetails.isActive());
                    
                    // Update role if provided
                    if (userDetails.getRole() != null) {
                        user.setRole(userDetails.getRole());
                    }
                    
                    // Only update password if provided
                    if (userDetails.getPassword() != null && !userDetails.getPassword().isBlank()) {
                        user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
                    }
                    
                    return ResponseEntity.ok(userRepository.save(user));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
