package com.esprit.pi.messangingservice.DTO;

import lombok.*;

/**
 * Réponse après upload d'un fichier.
 * Retournée par POST /api/chat/upload
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileUploadResponse {
    private String id;           // ID MongoDB du message créé
    private String url;          // URL publique du fichier
    private String fileName;     // Nom original
    private String fileSize;     // Taille lisible "2.4 MB"
    private String fileMimeType; // MIME type
    private String type;         // "image" | "video" | "audio" | "file"
}