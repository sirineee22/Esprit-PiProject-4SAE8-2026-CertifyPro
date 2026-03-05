package com.esprit.pi.messangingservice.DTO;

// dto/ChatUserResponse.java
// Format exact → interface Angular ChatUser
import lombok.Data;

@Data
public class ChatUserResponse {
    private String roomId;  // pour ouvrir la room directement
    private String image;
    private String userId;    // <-- AJOUTER
    private String name;
    private String status;
    private String unread;
}