package com.esprit.pi.messangingservice.Services;

import com.esprit.pi.messangingservice.entities.ChatRoom;
import com.esprit.pi.messangingservice.repositories.ChatRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ChatRoomService {

    private final ChatRoomRepository roomRepository;

    // ─────────────────────────────────────────────
    // Trouver une room par ID
    // ─────────────────────────────────────────────
    public Optional<ChatRoom> findById(String roomId) {
        return roomRepository.findById(roomId);
    }

    // ─────────────────────────────────────────────
    // Sauvegarder une room
    // ─────────────────────────────────────────────
    public ChatRoom save(ChatRoom room) {
        return roomRepository.save(room);
    }

    // ─────────────────────────────────────────────
    // Récupérer toutes les rooms d’un utilisateur
    // ─────────────────────────────────────────────
    public List<ChatRoom> getRoomsForUser(String userId) {
        return roomRepository.findByMemberIdsContaining(userId);
    }

    // ─────────────────────────────────────────────
    // Créer OU récupérer une room DIRECT
    // ─────────────────────────────────────────────
    public ChatRoom getOrCreateDirect(String userId1, String userId2) {
        return roomRepository
                .findDirectRoomBetweenUsers(ChatRoom.RoomType.DIRECT, userId1, userId2)
                .orElseGet(() -> {
                    ChatRoom room = ChatRoom.builder()
                            .type(ChatRoom.RoomType.DIRECT)
                            .memberIds(new HashSet<>(Arrays.asList(userId1, userId2)))
                            .build();
                    return roomRepository.save(room);
                });
    }

    // ─────────────────────────────────────────────
    // Créer une room DIRECT (utilisée par /connect)
    // ─────────────────────────────────────────────
    public ChatRoom createDirectRoom(String user1, String user2) {
        ChatRoom room = ChatRoom.builder()
                .type(ChatRoom.RoomType.DIRECT)
                .memberIds(new HashSet<>(Arrays.asList(user1, user2)))
                .build();
        return roomRepository.save(room);
    }

    // ─────────────────────────────────────────────
    // Créer une room GROUPE
    // ─────────────────────────────────────────────
    public ChatRoom createGroup(String name, List<String> memberIds) {
        ChatRoom room = ChatRoom.builder()
                .name(name)
                .type(ChatRoom.RoomType.GROUP)
                .memberIds(new HashSet<>(memberIds))
                .build();
        return roomRepository.save(room);
    }

    // ─────────────────────────────────────────────
    // Mettre à jour le dernier message
    // ─────────────────────────────────────────────
    public void updateLastMessage(String roomId, String senderName, String msg) {
        roomRepository.findById(roomId).ifPresent(room -> {
            room.setLastMessage(msg);
            room.setLastSenderName(senderName);
            roomRepository.save(room);
        });
    }

    // ─────────────────────────────────────────────
    // Récupérer tous les groupes
    // ─────────────────────────────────────────────
    public List<ChatRoom> getAllGroups() {
        return roomRepository.findByType(ChatRoom.RoomType.GROUP);
    }
}