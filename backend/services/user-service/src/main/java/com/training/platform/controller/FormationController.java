package com.training.platform.controller;

import com.training.platform.entity.Formation;
import com.training.platform.entity.TrainingType;
import com.training.platform.service.FormationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/formations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FormationController {
    private final FormationService formationService;
    private final com.training.platform.repository.UserRepository userRepository;
    private final String UPLOAD_DIR = "uploads/";

    @GetMapping
    public List<Formation> getAllFormations() {
        return formationService.getAllFormations();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Formation> getFormationById(@PathVariable("id") Long id) {
        return formationService.getFormationById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping(consumes = { "multipart/form-data" })
    public ResponseEntity<?> createFormation(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("level") String level,
            @RequestParam("duration") String duration,
            @RequestParam("trainingType") String trainingType,
            @RequestParam(value = "trainerId", required = false) Long trainerId,
            @RequestParam("file") MultipartFile file) {

        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath))
                Files.createDirectories(uploadPath);

            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath);

            Formation formation = new Formation();
            formation.setTitle(title);
            formation.setDescription(description);
            formation.setLevel(level);
            formation.setDuration(duration);
            formation.setTrainingType(TrainingType.valueOf(trainingType.toUpperCase()));
            formation.setContentUrl("/api/formations/files/" + fileName);

            if (trainerId != null) {
                userRepository.findById(trainerId).ifPresent(formation::setTrainer);
            }

            return ResponseEntity.ok(formationService.createFormation(formation));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Creation failed: " + e.getMessage());
        }
    }

    @PostMapping(value = "/{id}/update", consumes = { "multipart/form-data" })
    public ResponseEntity<?> updateFormation(
            @PathVariable("id") Long id,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "level", required = false) String level,
            @RequestParam(value = "duration", required = false) String duration,
            @RequestParam(value = "trainingType", required = false) String trainingType,
            @RequestParam(value = "trainerId", required = false) Long trainerId,
            @RequestParam(value = "file", required = false) MultipartFile file) {

        return formationService.getFormationById(id).map(existing -> {
            try {
                if (title != null)
                    existing.setTitle(title);
                if (description != null)
                    existing.setDescription(description);
                if (level != null)
                    existing.setLevel(level);
                if (duration != null)
                    existing.setDuration(duration);
                if (trainingType != null && !trainingType.isEmpty()) {
                    existing.setTrainingType(TrainingType.valueOf(trainingType.toUpperCase()));
                }

                if (file != null && !file.isEmpty()) {
                    Path uploadPath = Paths.get(UPLOAD_DIR);
                    if (!Files.exists(uploadPath))
                        Files.createDirectories(uploadPath);

                    if (existing.getContentUrl() != null && existing.getContentUrl().contains("/")) {
                        String oldFileName = existing.getContentUrl()
                                .substring(existing.getContentUrl().lastIndexOf("/") + 1);
                        Files.deleteIfExists(uploadPath.resolve(oldFileName));
                    }

                    String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
                    Files.copy(file.getInputStream(), uploadPath.resolve(fileName));
                    existing.setContentUrl("/api/formations/files/" + fileName);
                }

                if (trainerId != null) {
                    userRepository.findById(trainerId).ifPresent(existing::setTrainer);
                }

                return ResponseEntity.ok(formationService.createFormation(existing));
            } catch (Exception e) {
                return ResponseEntity.status(500).body("Update failed: " + e.getMessage());
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFormation(@PathVariable("id") Long id) {
        return formationService.getFormationById(id).map(formation -> {
            try {
                if (formation.getContentUrl() != null && formation.getContentUrl().contains("/files/")) {
                    String fileName = formation.getContentUrl()
                            .substring(formation.getContentUrl().lastIndexOf("/") + 1);
                    Files.deleteIfExists(Paths.get(UPLOAD_DIR).resolve(fileName));
                }
                formationService.deleteFormation(id);
                return ResponseEntity.noContent().<Void>build();
            } catch (IOException e) {
                return ResponseEntity.internalServerError().<Void>build();
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/files/{filename:.+}")
    public ResponseEntity<byte[]> getFile(@PathVariable("filename") String filename) throws IOException {
        Path filePath = Paths.get(UPLOAD_DIR).resolve(filename);
        if (!Files.exists(filePath))
            return ResponseEntity.notFound().build();

        byte[] content = Files.readAllBytes(filePath);
        String contentType = Files.probeContentType(filePath);
        return ResponseEntity.ok()
                .header("Content-Type", contentType)
                .body(content);
    }
}
