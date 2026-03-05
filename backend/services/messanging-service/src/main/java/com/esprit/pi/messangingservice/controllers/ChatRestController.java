package com.esprit.pi.messangingservice.controllers;

import com.esprit.pi.messangingservice.DTO.*;
import com.esprit.pi.messangingservice.Services.*;
import com.esprit.pi.messangingservice.config.JwtService;
import com.esprit.pi.messangingservice.entities.ChatRoom;
import com.esprit.pi.messangingservice.entities.ChatUser;
import com.esprit.pi.messangingservice.entities.Message;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatRestController {

    private final MessageService         messageService;
    private final ChatRoomService        roomService;
    private final ChatUserService        userService;
    private final ContactService         contactService;
    private final JwtService             jwtService;
    private final FileStorageService     fileStorageService;
    private final SimpMessagingTemplate  messaging; // ✅ AJOUTÉ

    // ── Register avec JWT ──
    @PostMapping("/users/register")
    public ResponseEntity<ChatUser> register(HttpServletRequest req) {
        String token  = getToken(req);
        String userId = jwtService.extractUserId(token);

        if (userId == null || userId.isBlank())
            return ResponseEntity.badRequest().build();

        String email = jwtService.extractEmail(token);
        String name  = jwtService.extractName(token);
        String image = jwtService.extractImage(token);

        if (name == null || name.isBlank()) {
            name = (email != null && !email.isBlank())
                    ? email.split("@")[0]
                    : "User-" + userId;
        }

        System.out.println("✅ [Register] userId=" + userId + " | name=" + name + " | email=" + email);

        ConnectRequest connect = new ConnectRequest();
        connect.setUserId(userId);
        connect.setName(name);
        connect.setEmail(email != null ? email : "");
        connect.setImage(image != null ? image : "");

        return ResponseEntity.ok(userService.connect(connect));
    }

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
                                    dto.setUserId(other.getUserId());
                                    dto.setName(other.getName() != null ? other.getName() : "User-" + other.getUserId());
                                    dto.setImage(other.getImage() != null ? other.getImage() : "");
                                    dto.setStatus(other.getStatus() != null ? other.getStatus() : "offline");
                                    dto.setUnread("0");
                                    result.add(dto);
                                })
                );
        return ResponseEntity.ok(result);
    }

    // ── Groupes ──
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

    // ── Contacts ──
    @GetMapping("/contacts")
    public ResponseEntity<List<ContactModelResponse>> contacts() {
        return ResponseEntity.ok(contactService.getContactsGrouped());
    }

    // ── Ouvrir DM ──
    @PostMapping("/rooms/direct/{targetUserId}")
    public ResponseEntity<ChatRoom> openDirect(@PathVariable String targetUserId,
                                               HttpServletRequest req) {
        String userId = jwtService.extractUserId(getToken(req));
        if (userId == null || targetUserId == null || targetUserId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(roomService.getOrCreateDirect(userId, targetUserId));
    }

    // ── Créer un groupe ──
    @PostMapping("/rooms/group")
    public ResponseEntity<ChatRoom> createGroup(@RequestParam String name,
                                                @RequestBody List<String> memberIds) {
        return ResponseEntity.ok(roomService.createGroup(name, memberIds));
    }

    // ── Supprimer un message ──
    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(@PathVariable String messageId) {
        messageService.delete(messageId);
        return ResponseEntity.noContent().build();
    }

    // ── Connecter à une room ──
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
            room = roomService.createDirectRoom(userId, userId);
        }

        return ResponseEntity.ok(room);
    }

    // ── Recherche utilisateurs ──
    @GetMapping("/users/search")
    public ResponseEntity<List<Map<String, Object>>> searchUsers(
            @RequestParam String query,
            HttpServletRequest req) {

        String currentUserId = jwtService.extractUserId(getToken(req));
        if (currentUserId == null) return ResponseEntity.badRequest().build();

        List<Map<String, Object>> results = userService.searchUsers(query, currentUserId);
        return ResponseEntity.ok(results);
    }

    // ════════════════════════════════════════════════════
    // ✅ 1. Statut de lecture
    // ════════════════════════════════════════════════════

    @PostMapping("/messages/{messageId}/read")
    public ResponseEntity<Void> markRead(
            @PathVariable String messageId,
            @RequestHeader("X-User-Id") String userId) {
        messageService.markAsRead(messageId, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/rooms/{chatRoomId}/read-all")
    public ResponseEntity<Void> markAllRead(
            @PathVariable String chatRoomId,
            @RequestHeader("X-User-Id") String userId) {
        messageService.markAllAsRead(chatRoomId, userId);
        return ResponseEntity.ok().build();
    }

    // ════════════════════════════════════════════════════
    // ✅ 3. Messages épinglés
    // ════════════════════════════════════════════════════

    @PostMapping("/messages/{messageId}/pin")
    public ResponseEntity<ChatMessageResponse> togglePin(
            @PathVariable String messageId,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(messageService.togglePin(messageId, userId));
    }

    @GetMapping("/rooms/{chatRoomId}/pinned")
    public ResponseEntity<List<ChatMessageResponse>> getPinned(
            @PathVariable String chatRoomId,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(messageService.getPinnedMessages(chatRoomId, userId));
    }

    // ════════════════════════════════════════════════════
    // ✅ 5. Recherche dans les messages
    // ════════════════════════════════════════════════════

    @GetMapping("/rooms/{chatRoomId}/search")
    public ResponseEntity<List<ChatMessageResponse>> searchMessages(
            @PathVariable String chatRoomId,
            @RequestParam String keyword,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(messageService.searchMessages(chatRoomId, keyword, userId));
    }

    @GetMapping("/messages/search")
    public ResponseEntity<List<ChatMessageResponse>> searchGlobal(
            @RequestParam String keyword,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(messageService.searchGlobal(keyword, userId));
    }

    // ════════════════════════════════════════════════════
    // ✅ Messages d'un room
    // ════════════════════════════════════════════════════

    @GetMapping("/messages/{chatRoomId}")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(
            @PathVariable String chatRoomId,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(messageService.getByRoomDto(chatRoomId, userId));
    }

    // ════════════════════════════════════════════════════
    // ✅ UPLOAD FICHIER — avec broadcast WebSocket
    // ════════════════════════════════════════════════════

    @PostMapping("/upload")
    public ResponseEntity<ChatMessageResponse> uploadFile(
            @RequestParam("file")        MultipartFile file,
            @RequestParam("chatRoomId")  String chatRoomId,
            @RequestParam("senderId")    String senderId,
            @RequestParam("name")        String name,
            @RequestParam(value = "profile",   required = false) String profile,
            @RequestParam(value = "replyToId", required = false) String replyToId
    ) throws Exception {

        // 1. Valider + détecter le type + stocker
        fileStorageService.validate(file);
        String mime  = file.getContentType();
        String type  = fileStorageService.detectType(mime);
        String url   = fileStorageService.store(file, type);
        String size  = fileStorageService.formatSize(file.getSize());
        String fname = file.getOriginalFilename();

        // 2. Construire la requête message
        MessageRequest req = new MessageRequest();
        req.setChatRoomId(chatRoomId);
        req.setSenderId(senderId);
        req.setName(name);
        req.setProfile(profile != null ? profile : "");
        req.setType(type);
        req.setFileUrl(url);
        req.setFileName(fname);
        req.setFileSize(size);
        req.setFileMimeType(mime);
        req.setReplyToId(replyToId);
        req.setMessage(fname); // fallback texte = nom du fichier

        // 3. Sauvegarder
        Message saved = messageService.save(req);
        ChatMessageResponse dto = messageService.toDto(saved, senderId);

        // 4. ✅ Broadcast WebSocket → l'autre utilisateur reçoit le fichier en temps réel
        messaging.convertAndSend("/topic/room/" + chatRoomId, dto);

        return ResponseEntity.ok(dto);
    }

    // ════════════════════════════════════════════════════
    // ✅ LOCALISATION — avec broadcast WebSocket
    // ════════════════════════════════════════════════════

    @PostMapping("/location")
    public ResponseEntity<ChatMessageResponse> sendLocation(
            @RequestBody LocationRequest req) {

        MessageRequest messageRequest = new MessageRequest();
        messageRequest.setChatRoomId(req.getChatRoomId());
        messageRequest.setSenderId(req.getSenderId());
        messageRequest.setName(req.getName());
        messageRequest.setProfile(req.getProfile() != null ? req.getProfile() : "");
        messageRequest.setType("location");
        messageRequest.setLatitude(req.getLatitude());
        messageRequest.setLongitude(req.getLongitude());
        messageRequest.setMessage("📍 Position partagée");

        Message saved = messageService.save(messageRequest);
        ChatMessageResponse dto = messageService.toDto(saved, req.getSenderId());

        // ✅ Broadcast WebSocket
        messaging.convertAndSend("/topic/room/" + req.getChatRoomId(), dto);

        return ResponseEntity.ok(dto);
    }

    // ════════════════════════════════════════════════════
    // ✅ RÉACTIONS
    // ════════════════════════════════════════════════════

    @PostMapping("/messages/{messageId}/reactions")
    public ResponseEntity<ChatMessageResponse> react(
            @PathVariable String messageId,
            @RequestBody ReactionRequest req) {
        return ResponseEntity.ok(messageService.addReaction(messageId, req));
    }

    // ── Utilitaire : extraire le JWT ──
    private String getToken(HttpServletRequest req) {
        String header = req.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer "))
            throw new RuntimeException("Token manquant ou invalide");
        return header.substring(7);
    }
}