package com.esprit.pi.messangingservice.repositories;

import com.esprit.pi.messangingservice.entities.Message;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface MessageRepository extends MongoRepository<Message, String> {
    List<Message> findByChatRoomIdAndDeletedFalseOrderByCreatedAtAsc(String chatRoomId);
    default List<Message> findByChatRoomIdAndDeletedFalse(String chatRoomId) {
        return findByChatRoomIdAndDeletedFalseOrderByCreatedAtAsc(chatRoomId);
    }
        List<Message> findByChatRoomIdAndPinnedTrueAndDeletedFalse(String chatRoomId);

        @Query("{ 'chatRoomId': ?0, 'deleted': false, 'message': { $regex: ?1, $options: 'i' } }")
        List<Message> searchInRoom(String chatRoomId, String keyword);
        @Query("{ 'deleted': false, 'message': { $regex: ?0, $options: 'i' } }")
        List<Message> searchGlobal(String keyword);

        List<Message> findByChatRoomIdAndMentionedUserIdsContaining(String chatRoomId, String userId);
    }