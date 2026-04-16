package com.training.platform.controller;

import com.training.platform.dto.UpdateUserRequest;
import com.training.platform.entity.User;
import com.training.platform.entity.AuditLog;
import com.training.platform.repository.RoleRepository;
import com.training.platform.repository.UserRepository;
import com.training.platform.repository.AuditLogRepository;
import com.training.platform.security.JwtAuthenticationFilter;
import com.training.platform.service.EmailService;
import com.training.platform.service.TwoFactorService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
        "image/jpeg", "image/png", "image/gif", "image/webp"
    );
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private TwoFactorService twoFactorService;

    @Value("${app.upload.profile-dir:uploads/profile}")
    private String profileImageUploadDirName;

    private Path getProfileImageUploadDir() {
        return Paths.get(profileImageUploadDirName).toAbsolutePath();
    }

    private Optional<JwtAuthenticationFilter.JwtUserDetails> getCurrentUserDetails() {
        Object details = SecurityContextHolder.getContext().getAuthentication().getDetails();
        if (details instanceof JwtAuthenticationFilter.JwtUserDetails u) {
            return Optional.of(u);
        }
        return Optional.empty();
    }

    private Optional<Long> getCurrentUserId() {
        return getCurrentUserDetails().map(u -> u.userId);
    }

    private boolean isAdmin() {
        Object details = SecurityContextHolder.getContext().getAuthentication().getDetails();
        if (details instanceof JwtAuthenticationFilter.JwtUserDetails u) {
            return "ADMIN".equals(u.role);
        }
        return false;
    }

    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        Optional<Long> currentId = getCurrentUserId();
        if (currentId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (!currentId.get().equals(id) && !isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // --- 2FA Endpoints ---

    @PostMapping("/{id}/2fa/setup")
    public ResponseEntity<?> setup2fa(@PathVariable Long id) {
        if (!getCurrentUserId().filter(uid -> uid.equals(id)).isPresent()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return userRepository.findById(id).map(user -> {
            try {
                String secret = twoFactorService.generateNewSecret();
                String qrCodeUrl = twoFactorService.getQrCodeUrl(secret, user.getEmail());
                return ResponseEntity.ok(java.util.Map.of(
                    "secret", secret,
                    "qrCodeUrl", qrCodeUrl
                ));
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la génération du QR Code");
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/2fa/enable")
    public ResponseEntity<?> enable2fa(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        if (!getCurrentUserId().filter(uid -> uid.equals(id)).isPresent()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String secret = body.get("secret");
        String code = body.get("code");

        if (secret == null || code == null) {
            return ResponseEntity.badRequest().body("Secret and code are required");
        }

        return userRepository.findById(id).map(user -> {
            if (twoFactorService.isCodeValid(secret, code)) {
                user.setTwoFactorSecret(secret);
                user.setTwoFactorEnabled(true);
                userRepository.save(user);
                return ResponseEntity.ok(java.util.Map.of("message", "2FA activée avec succès"));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Code invalide");
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/2fa/disable")
    public ResponseEntity<?> disable2fa(@PathVariable Long id) {
        if (!getCurrentUserId().filter(uid -> uid.equals(id)).isPresent()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return userRepository.findById(id).map(user -> {
            user.setTwoFactorEnabled(false);
            user.setTwoFactorSecret(null);
            userRepository.save(user);
            return ResponseEntity.ok(java.util.Map.of("message", "2FA désactivée"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/batch")
    public List<User> getUsersByIds(@RequestParam("ids") List<Long> ids) {
        if (ids == null || ids.isEmpty()) return List.of();
        return userRepository.findAllById(ids);
    }

    @GetMapping("/profile-image/{filename}")
    public ResponseEntity<Resource> serveProfileImage(@PathVariable String filename) {
        if (filename == null || filename.isBlank() || filename.contains("..")) {
            return ResponseEntity.badRequest().build();
        }
        Path file = getProfileImageUploadDir().resolve(filename);
        if (!Files.isRegularFile(file)) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = new FileSystemResource(file);
        String contentType = "image/jpeg";
        if (filename.endsWith(".png")) contentType = "image/png";
        else if (filename.endsWith(".gif")) contentType = "image/gif";
        else if (filename.endsWith(".webp")) contentType = "image/webp";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CACHE_CONTROL, "max-age=3600")
                .body(resource);
    }

    @PostMapping("/{id}/profile-image")
    public ResponseEntity<?> uploadProfileImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        Optional<Long> currentId = getCurrentUserId();
        if (currentId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (!currentId.get().equals(id) && !isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only upload your own profile image");
        }
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("No file provided");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
            return ResponseEntity.badRequest().body("Allowed types: JPEG, PNG, GIF, WebP");
        }
        if (file.getSize() > MAX_IMAGE_SIZE) {
            return ResponseEntity.badRequest().body("File too large (max 5 MB)");
        }
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User user = userOpt.get();
        String ext = contentType.equals("image/jpeg") ? "jpg" : contentType.equals("image/png") ? "png" : contentType.equals("image/gif") ? "gif" : "webp";
        String filename = id + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12) + "." + ext;
        try {
            Path dir = getProfileImageUploadDir();
            Files.createDirectories(dir);
            Path target = dir.resolve(filename);
            file.transferTo(target.toFile());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to save file");
        }
        String urlPath = "/api/users/profile-image/" + filename;
        user.setProfileImageUrl(urlPath);
        userRepository.save(user);
        return ResponseEntity.ok(user);
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
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            if (user.getRole() == null) {
                user.setRole(roleRepository.findByName("LEARNER")
                        .orElseThrow(() -> new RuntimeException("Default role LEARNER not found")));
            }
            User created = userRepository.save(user);
            
            getCurrentUserDetails().ifPresent(actor -> {
                auditLogRepository.save(new AuditLog("USER_CREATE", actor.userId, actor.email, "USER", String.valueOf(created.getId()), "Created new user: " + created.getEmail()));
            });

            emailService.sendWelcomeEmail(created.getEmail(), created.getFirstName());
            return ResponseEntity.ok(created);
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already exists");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
        Optional<Long> currentId = getCurrentUserId();
        if (currentId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (!currentId.get().equals(id) && !isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only update your own profile");
        }
        boolean admin = isAdmin();
        return userRepository.findById(id)
                .map(user -> {
                    if (request.getFirstName() != null && !request.getFirstName().isBlank()) {
                        user.setFirstName(request.getFirstName());
                    }
                    if (request.getLastName() != null && !request.getLastName().isBlank()) {
                        user.setLastName(request.getLastName());
                    }
                    if (request.getEmail() != null && !request.getEmail().isBlank()) {
                        user.setEmail(request.getEmail().trim().toLowerCase());
                    }
                    if (request.getPhoneNumber() != null) {
                        user.setPhoneNumber(request.getPhoneNumber());
                    }
                    if (request.getProfileImageUrl() != null) {
                        user.setProfileImageUrl(request.getProfileImageUrl().isBlank() ? null : request.getProfileImageUrl().trim());
                    }
                    if (admin) {
                        if (request.getActive() != null) {
                            user.setActive(request.getActive());
                        }
                        if (request.getRole() != null) {
                            user.setRole(request.getRole());
                        }
                    }
                    if (request.getPassword() != null && !request.getPassword().isBlank()) {
                        user.setPassword(passwordEncoder.encode(request.getPassword()));
                    }
                    User updated = userRepository.save(user);
                    getCurrentUserDetails().ifPresent(actor -> {
                        auditLogRepository.save(new AuditLog("USER_UPDATE", actor.userId, actor.email, "USER", String.valueOf(id), "Updated user: " + user.getEmail()));
                    });
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            userRepository.deleteById(id);
            getCurrentUserDetails().ifPresent(actor -> {
                auditLogRepository.save(new AuditLog("USER_DELETE", actor.userId, actor.email, "USER", String.valueOf(id), "Deleted user: " + user.getEmail()));
            });
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/approve-trainer")
    public ResponseEntity<?> approveTrainerRole(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            com.training.platform.entity.Role trainerRole = roleRepository.findByName("TRAINER")
                    .orElseThrow(() -> new RuntimeException("TRAINER role not found"));
            user.setRole(trainerRole);
            user.setActive(true);
            userRepository.save(user);
            return ResponseEntity.ok("User upgraded to trainer");
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/role")
    public ResponseEntity<String> getUserRole(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            return ResponseEntity.ok(user.getRole() != null ? user.getRole().getName() : "");
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public ResponseEntity<List<User>> searchUsersByName(@RequestParam String name) {
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity
                .ok(userRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(name, name));
    }
}
