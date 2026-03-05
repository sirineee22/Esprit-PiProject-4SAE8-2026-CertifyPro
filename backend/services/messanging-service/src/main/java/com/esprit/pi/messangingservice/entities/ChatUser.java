// entities/ChatUser.java
package com.esprit.pi.messangingservice.entities;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "chat_users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatUser {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    private String name;
    private String image;
    private String email;

    @Builder.Default
    private String status = "offline";

    @Builder.Default
    private boolean connected = false;
}