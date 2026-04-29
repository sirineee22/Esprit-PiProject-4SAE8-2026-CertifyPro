package com.training.platform.controller;

import com.training.platform.dto.FormationDTO;
import com.training.platform.entity.Formation;
import com.training.platform.entity.TrainingType;
import com.training.platform.service.FormationService;
import com.training.platform.client.UserClient;
import com.training.platform.client.UserDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/api/formations")
@RequiredArgsConstructor
public class FormationController {
    private final FormationService formationService;
    private final UserClient userClient;
    private final String UPLOAD_DIR = "uploads/";

    @GetMapping
    public ResponseEntity<Page<FormationDTO>> getAllFormations(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {

        Page<Formation> formations = formationService.getAllFormations(PageRequest.of(page, size));
        Page<FormationDTO> dtos = formations.map(this::mapToDTO);
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FormationDTO> getFormationById(@PathVariable("id") Long id) {
        return formationService.getFormationById(id)
                .map(this::mapToDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private FormationDTO mapToDTO(Formation formation) {
        FormationDTO dto = FormationDTO.builder()
                .id(formation.getId())
                .title(formation.getTitle())
                .description(formation.getDescription())
                .level(formation.getLevel())
                .duration(formation.getDuration())
                .trainingType(formation.getTrainingType())
                .contentUrl(formation.getContentUrl())
                .trainerId(formation.getTrainerId())
                .build();

        try {
            if (formation.getTrainerId() != null) {
                UserDTO trainer = userClient.getUserById(formation.getTrainerId());
                dto.setTrainer(trainer);
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch trainer with ID " + formation.getTrainerId() + ": " + e.getMessage());
        }
        return dto;
    }

    @PostMapping(consumes = { "multipart/form-data" })
    @PreAuthorize("hasRole('TRAINER') or hasRole('ADMIN')")
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
                formation.setTrainerId(trainerId);
            }

            return ResponseEntity.ok(formationService.createFormation(formation));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Creation failed: " + e.getMessage());
        }
    }

    @PostMapping(value = "/{id}/update", consumes = { "multipart/form-data" })
    @PreAuthorize("hasRole('TRAINER') or hasRole('ADMIN')")
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
                    existing.setTrainerId(trainerId);
                }

                return ResponseEntity.ok(formationService.createFormation(existing));
            } catch (Exception e) {
                return ResponseEntity.status(500).body("Update failed: " + e.getMessage());
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TRAINER') or hasRole('ADMIN')")
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
    public ResponseEntity<Resource> getFile(@PathVariable("filename") String filename) throws IOException {
        Path filePath = Paths.get(UPLOAD_DIR).resolve(filename).normalize();
        System.out.println("Trying to serve file: " + filePath.toAbsolutePath());

        if (!Files.exists(filePath)) {
            System.err.println("File not found: " + filePath.toAbsolutePath());
            return ResponseEntity.notFound().build();
        }

        Resource resource = new UrlResource(filePath.toUri());
        String contentType = Files.probeContentType(filePath);

        if (contentType == null) {
            if (filename.toLowerCase().endsWith(".pdf")) {
                contentType = "application/pdf";
            } else if (filename.toLowerCase().endsWith(".mp4")) {
                contentType = "video/mp4";
            } else {
                contentType = "application/octet-stream";
            }
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}
