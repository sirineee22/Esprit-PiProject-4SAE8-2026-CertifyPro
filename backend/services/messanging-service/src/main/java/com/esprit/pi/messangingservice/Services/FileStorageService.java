package com.esprit.pi.messangingservice.Services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

/**
 * Service de stockage des fichiers uploadés sur disque local.
 *
 * Structure des dossiers :
 *   uploads/
 *     images/
 *     videos/
 *     audio/
 *     files/
 *     documents/
 *
 * URL publique : {app.base-url}/uploads/{subdir}/{uuid.ext}
 * Servie par   : StaticResourceConfig
 */
@Service
@Slf4j
public class FileStorageService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.base-url:http://localhost:8085}")
    private String baseUrl;

    private static final String[] SUBDIRS = { "images", "videos", "audio", "files", "documents" };

    // ── Crée les dossiers au démarrage ─────────────────────
    @PostConstruct
    public void init() {
        for (String sub : SUBDIRS) {
            try {
                Files.createDirectories(Path.of(uploadDir, sub));
                log.info("📁 Dossier upload créé : {}/{}", uploadDir, sub);
            } catch (IOException e) {
                log.error("❌ Impossible de créer le dossier upload : {}/{}", uploadDir, sub);
            }
        }
    }

    // ── Stocker un fichier ─────────────────────────────────
    /**
     * @param file     Le fichier multipart
     * @param typeHint "image"|"video"|"audio"|"file"|"document" (optionnel)
     * @return URL publique du fichier stocké
     */
    public String store(MultipartFile file, String typeHint) throws IOException {
        String subDir   = resolveSubDir(typeHint, file.getContentType());
        String ext      = getExtension(file.getOriginalFilename());
        String fileName = UUID.randomUUID() + ext;
        Path dest       = Path.of(uploadDir, subDir, fileName);

        Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

        String publicUrl = baseUrl + "/uploads/" + subDir + "/" + fileName;
        log.info("✅ Fichier uploadé : {} → {}", fileName, publicUrl);
        return publicUrl;
    }

    // ── Détecter le type selon MIME ────────────────────────
    public String detectType(String mimeType) {
        if (mimeType == null) return "file";
        if (mimeType.startsWith("image/"))  return "image";
        if (mimeType.startsWith("video/"))  return "video";
        if (mimeType.startsWith("audio/"))  return "audio";
        return "file";
    }

    // ── Formater la taille ─────────────────────────────────
    public String formatSize(long bytes) {
        if (bytes < 1024)             return bytes + " B";
        if (bytes < 1024 * 1024)      return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024L * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024));
        return String.format("%.1f GB", bytes / (1024.0 * 1024 * 1024));
    }

    // ── Helpers privés ─────────────────────────────────────
    private String resolveSubDir(String typeHint, String mimeType) {
        if (typeHint != null) switch (typeHint) {
            case "image":    return "images";
            case "video":    return "videos";
            case "audio":    return "audio";
            case "document": return "documents";
            case "file":     return "files";
        }
        return switch (detectType(mimeType)) {
            case "image" -> "images";
            case "video" -> "videos";
            case "audio" -> "audio";
            default      -> "files";
        };
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf(".")).toLowerCase();
    }

    // ── Valider le fichier ─────────────────────────────────
    public void validate(MultipartFile file) {
        if (file == null || file.isEmpty())
            throw new IllegalArgumentException("Fichier vide");

        // Max 100 MB
        if (file.getSize() > 100L * 1024 * 1024)
            throw new IllegalArgumentException("Fichier trop grand (max 100 MB)");

        // Extensions interdites
        String name = (file.getOriginalFilename() != null ? file.getOriginalFilename() : "").toLowerCase();
        String[] blocked = { ".exe", ".bat", ".sh", ".cmd", ".ps1", ".msi", ".vbs", ".jar" };
        for (String ext : blocked) {
            if (name.endsWith(ext))
                throw new IllegalArgumentException("Type de fichier non autorisé : " + ext);
        }
    }
}