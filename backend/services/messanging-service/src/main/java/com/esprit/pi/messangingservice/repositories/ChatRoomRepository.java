package com.esprit.pi.messangingservice.repositories;

import com.esprit.pi.messangingservice.entities.ChatRoom;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import java.util.Optional;
import java.util.List;

public interface ChatRoomRepository extends MongoRepository<ChatRoom, String> {

    List<ChatRoom> findByMemberIdsContaining(String userId);

    List<ChatRoom> findByType(ChatRoom.RoomType type);

    // Méthode corrigée pour room directe
    @Query("{ 'type': ?0, 'memberIds': { $all: [?1, ?2] } }")
    Optional<ChatRoom> findDirectRoomBetweenUsers(ChatRoom.RoomType type, String userId1, String userId2);
}