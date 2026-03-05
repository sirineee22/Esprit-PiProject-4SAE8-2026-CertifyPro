package com.esprit.pi.messangingservice.DTO;

import lombok.*;

/**
 * Payload pour envoyer une localisation GPS.
 * POST /api/chat/location
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LocationRequest {
    private String chatRoomId;
    private String senderId;
    private String name;
    private String profile;
    private Double latitude;
    private Double longitude;
}