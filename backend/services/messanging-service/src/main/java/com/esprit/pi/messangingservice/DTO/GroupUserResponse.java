package com.esprit.pi.messangingservice.DTO;

// dto/GroupUserResponse.java
// Format exact → interface Angular GroupUser

import lombok.Data;

@Data
public class GroupUserResponse {
    private String roomId;
    private String name;
    private String unread;
}