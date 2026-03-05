package com.esprit.pi.messangingservice.entities;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "contact_groups")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ContactGroup {

    @Id
    private String id;

    // Identique à l'interface Angular ContactModel
    private String title;

    private String ownerId;

    @Builder.Default
    private List<ContactItem> contacts = new ArrayList<>();

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ContactItem {
        private String name;
        private String profile;
        private String userId;
    }
}