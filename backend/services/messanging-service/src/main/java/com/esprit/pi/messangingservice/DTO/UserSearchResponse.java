package com.esprit.pi.messangingservice.DTO;

import lombok.Data;

// ✅ DTO retourné par searchUsers
// Le champ "id" doit contenir le userId (String) utilisé par Angular
// pour appeler addContactByUserId()
@Data
public class UserSearchResponse {
    private String id;       // ← userId (pas l'ID MongoDB/JPA de ChatUser)
    private String name;
    private String email;
    private String profile;
}