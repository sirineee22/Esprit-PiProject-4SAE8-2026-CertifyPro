// entities/ChatRoom.java
package com.esprit.pi.messangingservice.entities;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Document(collection = "chat_rooms")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRoom {

    @Id
    private String id;

    private String name;
    private RoomType type;

    @Builder.Default
    private Set<String> memberIds = new HashSet<>();

    private String lastMessage;
    private String lastSenderName;

    @CreatedDate
    private Instant createdAt;
    private Instant  lastMessageAt;

    public enum RoomType { DIRECT, GROUP }
}