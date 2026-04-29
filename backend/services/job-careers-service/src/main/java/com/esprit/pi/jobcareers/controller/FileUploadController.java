package com.esprit.pi.jobcareers.controller;

import com.esprit.pi.jobcareers.config.FileStorageConfig;
import com.esprit.pi.jobcareers.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Map;
import java.util.UUID;
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Slf4j
public class FileUploadController {

    private final FileStorageConfig fileStorageConfig;

    @PostMapping("/upload/resume")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadResume(@RequestParam("file") MultipartFile file) {
        return upload(file, "resumes");
    }

    private ResponseEntity<ApiResponse<Map<String, String>>> upload(MultipartFile file, String subDir) {
        if (file.isEmpty())
            return ResponseEntity.badRequest().body(ApiResponse.error("Fichier vide"));

        try {
            String original = file.getOriginalFilename();
            String extension = (original != null && original.contains(".")) ? original.substring(original.lastIndexOf(".")) : "";
            String fileName = UUID.randomUUID() + extension;

            Path uploadPath = Paths.get(fileStorageConfig.getUploadDir(), subDir);
            Files.createDirectories(uploadPath);

            Files.copy(file.getInputStream(), uploadPath.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);

            String url = "/uploads/" + subDir + "/" + fileName;
            log.info("Fichier uploadé: {}", url);

            return ResponseEntity.ok(ApiResponse.success(Map.of("url", url, "fileName", fileName), "Upload réussi"));

        } catch (IOException e) {
            log.error("Erreur upload: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(ApiResponse.error("Erreur upload: " + e.getMessage()));
        }
    }
}