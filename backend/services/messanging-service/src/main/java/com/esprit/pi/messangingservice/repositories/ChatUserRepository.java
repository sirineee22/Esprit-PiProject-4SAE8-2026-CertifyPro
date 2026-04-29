// repositories/ChatUserRepository.java
package com.esprit.pi.messangingservice.repositories;

import com.esprit.pi.messangingservice.entities.ChatUser;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface ChatUserRepository
        extends MongoRepository<ChatUser, String> {
    Optional<ChatUser> findByUserId(String userId);
    List<ChatUser> findByConnectedTrue();
    List<ChatUser> findAllByOrderByNameAsc();
    List<ChatUser> findByNameOrEmailContainingIgnoreCase(String name, String email, Pageable pageable);
    Optional<ChatUser> findByNameIgnoreCase(String name);
    }
