package com.esprit.pi.messangingservice.DTO;

// dto/ContactModelResponse.java
// Format exact → interface Angular ContactModel

import lombok.Data;
import java.util.List;

@Data
public class ContactModelResponse {
    private String title;
    private List<ContactItem> contacts;

    @Data
    public static class ContactItem {
        private String name;
        private String profile;
    }
}