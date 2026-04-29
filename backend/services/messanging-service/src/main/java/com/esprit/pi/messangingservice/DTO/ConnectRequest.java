package com.esprit.pi.messangingservice.DTO;

// dto/ConnectRequest.java

import lombok.Data;

@Data
public class ConnectRequest {
    private String userId;
    private String roomId;   // room existante (optionnel)
    private String name;
    private String image;
    private String email;
}