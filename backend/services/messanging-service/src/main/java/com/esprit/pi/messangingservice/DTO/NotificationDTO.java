package com.esprit.pi.messangingservice.DTO;

import lombok.*;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDTO {
    private String  id;
    private String  recipientId;
    private String  senderId;
    private String  senderName;
    private String  senderAvatar;
    private String  type;
    private String  title;
    private String  body;
    private String  icon;
    private String  chatRoomId;
    private String  messageId;
    private String  routerLink;
    private boolean read;
    private Instant createdAt;
}