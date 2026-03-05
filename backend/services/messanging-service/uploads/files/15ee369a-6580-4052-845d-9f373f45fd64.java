package com.esprit.pi.messangingservice.controllers;

import com.esprit.pi.messangingservice.DTO.*;
import com.esprit.pi.messangingservice.Services.ChatRoomService;
import com.esprit.pi.messangingservice.Services.ChatUserService;
import com.esprit.pi.messangingservice.Services.ContactService;
import com.esprit.pi.messangingservice.Services.MessageService;
import com.esprit.pi.messangingservice.config.JwtService;
import com.esprit.pi.messangingservice.entities.ChatRoom;
import com.esprit.pi.messangingservice.entities.ChatUser;
import com.esprit.pi.messangingservice.entities.Message;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatRestController {

    private final MessageService  messageService;
    private final ChatRoomService roomService;
    private final ChatUserService userService;
    private final ContactService  contactService;
    private final JwtService      jwtService;

    // ── Register avec JWT ──
    @PostMapping("/users/register")
    public ResponseEntity<ChatUser> register(HttpServletRequest req) {
        String token = getToken(req);
        String userId = jwtService.extractUserId(token);
        if (userId == null || userId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        String email = jwtService.extractEmail(token);
        String name  = jwtService.extractName(token);
        String image = jwtService.extractImage(token);

        if (name == null || name.isBlank()) {
            name = (email != null && !email.isBlank())
                    ? email.split("@")[0]
                    : "User-" + userId;
        }

        ConnectRequest connect = new ConnectRequest();
        connect.setUserId(userId);
        connect.setName(name);
        connect.setEmail(email != null ? email : "");
        connect.setImage(image != null ? image : "");

        return ResponseEntity.ok(userService.connect(connect));
    }

    // ── Utilisateurs (DM) → Angular chatData ──
    @GetMapping("/chatdata")
    public ResponseEntity<List<ChatUserResponse>> chatData(HttpServletRequest req) {
        String userId = jwtService.extractUserId(getToken(req));
        if (userId == null) return ResponseEntity.badRequest().build();

        List<ChatUserResponse> result = new ArrayList<>();

        roomService.getRoomsForUser(userId).stream()
                .filter(r -> r.getType() == ChatRoom.RoomType.DIRECT)
                .forEach(room ->
                        room.getMemberIds().stream()
                                .filter(id -> !id.equals(userId))
                                .findFirst()
                                .flatMap(userService::findByUserId)
                                .ifPresent(other -> {
                                    ChatUserResponse dto = new ChatUserResponse();
                                    dto.setRoomId(room.getId());
                                    dto.setName(other.getName() != null ? other.getName() : "User-" + other.getUserId());
                                    dto.setImage(other.getImage() != null ? other.getImage() : "");
                                    dto.setStatus(other.getStatus() != null ? other.getStatus() : "offline");
                                    dto.setUnread("0");
                                    result.add(dto);
                                })
                );
        return ResponseEntity.ok(result);
    }

    // ── Groupes → Angular groupData ──
    @GetMapping("/groupdata")
    public ResponseEntity<List<GroupUserResponse>> groupData(HttpServletRequest req) {
        String userId = jwtService.extractUserId(getToken(req));
        if (userId == null) return ResponseEntity.badRequest().build();

        List<GroupUserResponse> result = roomService.getRoomsForUser(userId).stream()
                .filter(r -> r.getType() == ChatRoom.RoomType.GROUP)
                .map(room -> {
                    GroupUserResponse dto = new GroupUserResponse();
                    dto.setRoomId(room.getId());
                    dto.setName(room.getName() != null ? room.getName() : "Groupe");
                    dto.setUnread("0");
                    return dto;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ── Contacts → Angular contactData ──
    @GetMapping("/contacts")
    public ResponseEntity<List<ContactModelResponse>> contacts() {
        return ResponseEntity.ok(contactService.getContactsGrouped());
    }

    // ── Ouvrir DM avec un utilisateur (par son userId) ──
    @PostMapping("/rooms/direct/{targetUserId}")
    public ResponseEntity<ChatRoom> openDirect(@PathVariable String targetUserId,
                                               HttpServletRequest req) {
        String userId = jwtService.extractUserId(getToken(req));
        if (userId == null || targetUserId == null || targetUserId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(roomService.getOrCreateDirect(userId, targetUserId));
    }

    // ── Créer un groupe (CORRIGÉ) ──
    @PostMapping("/rooms/group")
    public ResponseEntity<ChatRoom> createGroup(@RequestParam String name,
                                                @RequestBody List<String> memberIds,
                                                HttpServletRequest req) {
        String creatorId = jwtService.extractUserId(getToken(req));
        if (creatorId == null) {
            return ResponseEntity.badRequest().build();
        }
        // Ajouter le créateur s'il n'est pas déjà présent
        if (!memberIds.contains(creatorId)) {
            memberIds.add(creatorId);
        }
        ChatRoom room = roomService.createGroup(name, memberIds);
        return ResponseEntity.ok(room);
    }

    // ── Messages d'une room ──
    @GetMapping("/messages/{chatRoomId}")
    public ResponseEntity<List<Message>> messages(@PathVariable String chatRoomId) {
        if (chatRoomId == null || chatRoomId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(messageService.getByRoom(chatRoomId));
    }

    // ── Supprimer un message ──
    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(@PathVariable String messageId) {
        messageService.delete(messageId);
        return ResponseEntity.noContent().build();
    }

    // ── Connecter à une room existante ──
    @PostMapping("/rooms/connect")
    public ResponseEntity<ChatRoom> connectRoom(@RequestBody ConnectRequest request,
                                                HttpServletRequest req) {
        if (request.getRoomId() == null || request.getRoomId().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        String userId = request.getUserId();
        if (userId == null || userId.isBlank()) {
            userId = jwtService.extractUserId(getToken(req));
        }
        if (userId == null) return ResponseEntity.badRequest().build();

        Optional<ChatRoom> roomOpt = roomService.findById(request.getRoomId());
        ChatRoom room;

        if (roomOpt.isPresent()) {
            room = roomOpt.get();
            if (!room.getMemberIds().contains(userId)) {
                room.getMemberIds().add(userId);
                room = roomService.save(room);
            }
        } else {
            // roomId invalide → créer DM avec soi-même comme fallback
            room = roomService.createDirectRoom(userId, userId);
        }

        return ResponseEntity.ok(room);
    }

    // ── Recherche d'utilisateurs ──
    @GetMapping("/users/search")
    public ResponseEntity<List<UserSearchResponse>> searchUsers(@RequestParam("q") String query,
                                                                HttpServletRequest req) {
        String currentUserId = jwtService.extractUserId(getToken(req));
        if (currentUserId == null) {
            return ResponseEntity.badRequest().build();
        }
        if (query == null || query.trim().length() < 2) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        List<UserSearchResponse> results = userService.searchUsers(query.trim(), currentUserId);
        return ResponseEntity.ok(results);
    }

    // ── Utilitaire : extraire le JWT ──
    private String getToken(HttpServletRequest req) {
        String header = req.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer "))
            throw new RuntimeException("Token manquant ou invalide");
        return header.substring(7);
    }
}