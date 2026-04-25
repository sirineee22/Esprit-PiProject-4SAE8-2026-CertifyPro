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
@CrossOrigin(origins = "*")   // ✅ FIX: was missing — gateway forwards CORS but local dev needs it
public class ChatRestController {

    private final MessageService messageService;
    private final ChatRoomService roomService;
    private final ChatUserService userService;
    private final ContactService contactService;
    private final JwtService jwtService;
    private final FileStorageService fileStorageService;
    private final SimpMessagingTemplate messaging;

    // ─────────────────────────────────────────────────────
    // HELPER — extraire userId depuis le JWT
    // ─────────────────────────────────────────────────────

    /**
     * ✅ FIX: centralized token extraction with a proper exception message.
     * Previously thrown RuntimeException was uncaught and returned 500 instead of 401.
     */
    private String extractUserId(HttpServletRequest req) {
        String header = req.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        return jwtService.extractUserId(header.substring(7));
    }

    // ─────────────────────────────────────────────────────
    // REGISTER
    // ─────────────────────────────────────────────────────

    @PostMapping("/users/register")
    public ResponseEntity<ChatUser> register(HttpServletRequest req) {
        String token = req.getHeader("Authorization");
        if (token == null || !token.startsWith("Bearer "))
            return ResponseEntity.status(401).build();

        token = token.substring(7);
        String userId = jwtService.extractUserId(token);
        if (userId == null || userId.isBlank())
            return ResponseEntity.badRequest().build();

        ConnectRequest connect = new ConnectRequest();
        connect.setUserId(userId);
        connect.setName(jwtService.extractName(token));
        connect.setEmail(jwtService.extractEmail(token));
        connect.setImage(jwtService.extractImage(token));

        return ResponseEntity.ok(userService.connect(connect));
    }

    // ─────────────────────────────────────────────────────
    // USER SEARCH
    // ─────────────────────────────────────────────────────

    /**
     * ✅ FIX: endpoint was referenced in chat-api.service.ts but missing here.
     */
    @GetMapping("/users/search")
    public ResponseEntity<List<ChatUser>> searchUsers(
            @RequestParam String query,
            HttpServletRequest req) {

        String userId = extractUserId(req);
        if (userId == null) return ResponseEntity.status(401).build();

        List<ChatUser> results = userService.getAllUsers().stream()
                .filter(u -> !u.getUserId().equals(userId))
                .filter(u -> u.getName() != null &&
                        u.getName().toLowerCase().contains(query.toLowerCase()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(results);
    }

    // ─────────────────────────────────────────────────────
    // CHAT DATA
    // ─────────────────────────────────────────────────────

    @GetMapping("/chatdata")
    public ResponseEntity<List<ChatUserResponse>> chatData(HttpServletRequest req) {
        String userId = extractUserId(req);
        if (userId == null) return ResponseEntity.status(401).build();

        Map<String, String> rooms = new HashMap<>();
        roomService.getRoomsForUser(userId).stream()
                .filter(r -> r.getType() == ChatRoom.RoomType.DIRECT)
                .forEach(room -> room.getMemberIds().stream()
                        .filter(id -> !id.equals(userId))
                        .findFirst()
                        .ifPresent(other -> rooms.put(other, room.getId())));

        List<ChatUserResponse> result = userService.getAllUsers().stream()
                .filter(u -> !u.getUserId().equals(userId))
                .map(u -> {
                    ChatUserResponse dto = new ChatUserResponse();
                    dto.setUserId(u.getUserId());
                    dto.setName(u.getName());
                    dto.setImage(u.getImage());
                    dto.setStatus(u.getStatus());
                    // ✅ FIX: retourner null si pas de room existante, pas userId
                    // Le frontend doit appeler openDirectRoom() pour créer/récupérer la room
                    dto.setRoomId(rooms.getOrDefault(u.getUserId(), null));
                    dto.setUnread("0");
                    return dto;
                }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // ─────────────────────────────────────────────────────
    // ROOMS — Direct & Group
    // ─────────────────────────────────────────────────────

    /**
     * ✅ FIX: openDirectRoom was called from frontend but the endpoint was missing.
     */
    @PostMapping("/rooms/direct/{targetUserId}")
    public ResponseEntity<ChatRoom> openDirectRoom(
            @PathVariable String targetUserId,
            HttpServletRequest req) {

        String userId = extractUserId(req);
        if (userId == null) return ResponseEntity.status(401).build();

        ChatRoom room = roomService.getOrCreateDirectRoom(userId, targetUserId);
        return ResponseEntity.ok(room);
    }

    /**
     * ✅ FIX: createGroup was called from frontend but missing.
     */
    @PostMapping("/rooms/group")
    public ResponseEntity<ChatRoom> createGroup(
            @RequestParam String name,
            @RequestBody List<String> memberIds,
            HttpServletRequest req) {

        String userId = extractUserId(req);
        if (userId == null) return ResponseEntity.status(401).build();

        // Ensure creator is included
        if (!memberIds.contains(userId)) memberIds.add(userId);

        ChatRoom room = roomService.createGroupRoom(name, memberIds);
        return ResponseEntity.ok(room);
    }

    /**
     * ✅ FIX: getGroups was called from frontend (GET /groupdata) but missing.
     */
    @GetMapping("/groupdata")
    public ResponseEntity<List<ChatRoom>> groupData(HttpServletRequest req) {
        String userId = extractUserId(req);
        if (userId == null) return ResponseEntity.status(401).build();

        List<ChatRoom> groups = roomService.getRoomsForUser(userId).stream()
                .filter(r -> r.getType() == ChatRoom.RoomType.GROUP)
                .collect(Collectors.toList());

        return ResponseEntity.ok(groups);
    }

    // ─────────────────────────────────────────────────────
    // MESSAGES — get, delete
    // ─────────────────────────────────────────────────────

    @GetMapping("/messages/{roomId}")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(
            @PathVariable String roomId,
            HttpServletRequest req) {

        String userId = extractUserId(req);
        if (userId == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(messageService.getByRoomDto(roomId, userId));
    }

    /**
     * ✅ FIX: deleteMessage was called from frontend but missing.
     */
    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(
            @PathVariable String messageId,
            HttpServletRequest req) {

        String userId = extractUserId(req);
        if (userId == null) return ResponseEntity.status(401).build();
        messageService.delete(messageId, userId);
        return ResponseEntity.noContent().build();
    }

    // ─────────────────────────────────────────────────────
    // READ RECEIPTS (REST fallback)
    // ─────────────────────────────────────────────────────

    /**
     * ✅ FIX: markMessageRead REST endpoint was called from frontend but missing.
     * The WebSocket path also exists (/app/chat.read) — this is the HTTP fallback.
     */
    @PostMapping("/messages/{messageId}/read")
    public ResponseEntity<Void> markMessageRead(
            @PathVariable String messageId,
            HttpServletRequest req) {

        String userId = extractUserId(req);
        if (userId == null) return ResponseEntity.status(401).build();
        messageService.markAsRead(messageId, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * ✅ FIX: markAllRead REST endpoint was called from frontend but missing.
     */
    @PostMapping("/rooms/{roomId}/read-all")
    public ResponseEntity<Void> markAllRead(
            @PathVariable String roomId,
            HttpServletRequest req) {

        String userId = extractUserId(req);
        if (userId == null) return ResponseEntity.status(401).build();
        messageService.markAllAsRead(roomId, userId);
        return ResponseEntity.noContent().build();
    }

    // ─────────────────────────────────────────────────────
    // REACTIONS
    // ─────────────────────────────────────────────────────

    /**
     * ✅ FIX: sendReaction REST endpoint was called from frontend but missing.
     * The WebSocket path also exists (/app/chat.react).
     */
    @PostMapping("/messages/{messageId}/reactions")
    public ResponseEntity<ChatMessageResponse> addReaction(
            @PathVariable String messageId,
            @RequestBody ReactionRequest reactionRequest,
            HttpServletRequest req) {

        String userId = extractUserId(req);
        if (userId == null) return ResponseEntity.status(401).build();

        // Ensure the userId in the request matches the authenticated user
        reactionRequest.setUserId(userId);

        ChatMessageResponse dto = messageService.addReaction(messageId, reactionRequest);

        // Broadcast via WebSocket so other clients see the reaction in real-time
        Map<String, Object> event = new HashMap<>();
        event.put("event", "REACTION");
        event.put("messageId", messageId);
        event.put("reactions", dto.getReactions());
        messaging.convertAndSend("/topic/room/" + dto.getChatRoomId(), event);

        return ResponseEntity.ok(dto);
    }

    // ─────────────────────────────────────────────────────
    // PIN
    // ─────────────────────────────────────────────────────

    /**
     * ✅ FIX: togglePin was called from frontend but the endpoint was completely missing.
     */
    @PostMapping("/messages/{messageId}/pin")
    public ResponseEntity<ChatMessageResponse> togglePin(
            @PathVariable String messageId,
            HttpServletRequest req) {

        String userId = extractUserId(req);
        if (userId == null) return ResponseEntity.status(401).build();

        ChatMessageResponse dto = messageService.togglePin(messageId, userId);

        // Broadcast pin change so all room members see it immediately
        Map<String, Object> event = new HashMap<>();
        event.put("event", "PIN_CHANGED");
        event.put("messageId", messageId);
        event.put("pinned", dto.isPinned());
        messaging.convertAndSend("/topic/room/" + dto.getChatRoomId(), event);

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/rooms/{roomId}/pinned")
    public ResponseEntity<List<ChatMessageResponse>> getPinned(
            @PathVariable String roomId,
            HttpServletRequest req) {

        String userId = extractUserId(req);
        if (userId == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(messageService.getPinnedMessages(roomId, userId));
    }

    // ─────────────────────────────────────────────────────
    // SEARCH IN MESSAGES
    // ─────────────────────────────────────────────────────

    /**
     * ✅ FIX: searchMessages was called from frontend but the endpoint was missing.
     */
    @GetMapping("/rooms/{roomId}/search")
    public ResponseEntity<List<ChatMessageResponse>> searchMessages(
            @PathVariable String roomId,
            @RequestParam String keyword,
            HttpServletRequest req) {

        String userId = extractUserId(req);
        if (userId == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(messageService.searchMessages(roomId, keyword, userId));
    }

    // ─────────────────────────────────────────────────────
    // FILE UPLOAD
    // ─────────────────────────────────────────────────────

    @PostMapping("/upload")
    public ResponseEntity<ChatMessageResponse> upload(
            @RequestParam MultipartFile file,
            @RequestParam String chatRoomId,
            @RequestParam String senderId,
            @RequestParam String name) throws Exception {

        fileStorageService.validate(file);

        // ✅ FIX: détecter le type AVANT de stocker
        String detectedType = fileStorageService.detectType(file.getContentType());
        String url = fileStorageService.store(file, detectedType);

        MessageRequest msg = new MessageRequest();
        msg.setChatRoomId(chatRoomId);
        msg.setSenderId(senderId);
        msg.setName(name);
        msg.setFileUrl(url);
        msg.setFileName(file.getOriginalFilename());
        msg.setFileSize(fileStorageService.formatSize(file.getSize()));
        msg.setFileMimeType(file.getContentType());
        msg.setMessage(file.getOriginalFilename());
        // ✅ FIX: propager le type (image/video/audio/file) — sans ça tout s'affiche comme "text"
        msg.setType(detectedType);

        Message saved = messageService.save(msg);
        ChatMessageResponse dto = messageService.toDto(saved, senderId);

        messaging.convertAndSend("/topic/room/" + chatRoomId, dto);

        return ResponseEntity.ok(dto);
    }

    // ─────────────────────────────────────────────────────
    // LOCATION
    // ─────────────────────────────────────────────────────

    /**
     * ✅ FIX: sendLocation was called from frontend but the endpoint was missing.
     */
    @PostMapping("/location")
    public ResponseEntity<ChatMessageResponse> sendLocation(
            @RequestBody LocationRequest locationRequest,
            HttpServletRequest req) throws Exception {

        String userId = extractUserId(req);
        if (userId == null) return ResponseEntity.status(401).build();

        MessageRequest msg = new MessageRequest();
        msg.setChatRoomId(locationRequest.getChatRoomId());
        msg.setSenderId(userId);
        msg.setName(locationRequest.getName());
        msg.setMessage("📍 Location");
        msg.setLatitude(locationRequest.getLatitude());
        msg.setLongitude(locationRequest.getLongitude());
        // ✅ FIX: propager le type "location" — sans ça s'affiche comme texte
        msg.setType("location");
        // ✅ FIX: construire et sauvegarder locationUrl pour que le frontend puisse ouvrir Maps
        String locationUrl = "https://www.google.com/maps?q="
                + locationRequest.getLatitude() + "," + locationRequest.getLongitude();
        msg.setLocationUrl(locationUrl);

        Message saved = messageService.save(msg);
        ChatMessageResponse dto = messageService.toDto(saved, userId);

        messaging.convertAndSend("/topic/room/" + locationRequest.getChatRoomId(), dto);

        return ResponseEntity.ok(dto);
    }

    // ─────────────────────────────────────────────────────
    // EDIT MESSAGE
    // ─────────────────────────────────────────────────────

    @PutMapping("/messages/{messageId}")
    public ResponseEntity<ChatMessageResponse> editMessage(
            @PathVariable String messageId,
            @RequestBody Map<String, String> body,
            HttpServletRequest req) {

        String userId = extractUserId(req);
        if (userId == null) return ResponseEntity.status(401).build();

        String newText = body.get("message");
        if (newText == null || newText.isBlank())
            return ResponseEntity.badRequest().build();

        ChatMessageResponse dto = messageService.edit(messageId, userId, newText.trim());
        if (dto == null) return ResponseEntity.status(403).build();

        // Broadcast edit to all room members
        Map<String, Object> event = new HashMap<>();
        event.put("event",     "MESSAGE_EDITED");
        event.put("messageId", messageId);
        event.put("message",   newText.trim());
        event.put("edited",    true);
        messaging.convertAndSend("/topic/room/" + dto.getChatRoomId(), event);

        return ResponseEntity.ok(dto);
    }

    // ─────────────────────────────────────────────────────
    // DELETE ALL MESSAGES IN ROOM
    // ─────────────────────────────────────────────────────

    @DeleteMapping("/rooms/{roomId}/messages")
    public ResponseEntity<Void> deleteAllMessages(
            @PathVariable String roomId,
            HttpServletRequest req) {

        String userId = extractUserId(req);
        if (userId == null) return ResponseEntity.status(401).build();

        messageService.deleteAll(roomId, userId);

        // Broadcast to all room members
        Map<String, Object> event = new HashMap<>();
        event.put("event",      "ALL_MESSAGES_DELETED");
        event.put("chatRoomId", roomId);
        messaging.convertAndSend("/topic/room/" + roomId, event);

        return ResponseEntity.noContent().build();
    }

    /**
     * ✅ FIX: getContacts was called from frontend but missing.
     */
    @GetMapping("/contacts")
    public ResponseEntity<List<?>> getContacts(HttpServletRequest req) {
        String userId = extractUserId(req);
        if (userId == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(contactService.getContacts(userId));
    }

    // ─────────────────────────────────────────────────────
    // PRESENCE — lastSeen + online status
    // ─────────────────────────────────────────────────────

    /**
     * Returns presence info (status + lastSeen) for a given userId.
     * Frontend polls this or uses WebSocket status events.
     */
    @GetMapping("/users/{targetUserId}/presence")
    public ResponseEntity<Map<String, Object>> getPresence(
            @PathVariable String targetUserId,
            HttpServletRequest req) {

        String userId = extractUserId(req);
        if (userId == null) return ResponseEntity.status(401).build();

        return userService.findByUserId(targetUserId)
                .map(u -> {
                    Map<String, Object> presence = new java.util.LinkedHashMap<>();
                    presence.put("userId",    u.getUserId());
                    presence.put("status",    u.getStatus());
                    presence.put("connected", u.isConnected());
                    presence.put("lastSeen",  u.getLastSeen() != null ? u.getLastSeen().toString() : null);
                    return ResponseEntity.ok(presence);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ─────────────────────────────────────────────────────
    // SEEN BY — who read a message (group detail)
    // ─────────────────────────────────────────────────────

    /**
     * Returns the list of users who have read a given message.
     * Used for the "Vu par" panel in group conversations.
     */
    @GetMapping("/messages/{messageId}/seen-by")
    public ResponseEntity<List<Map<String, Object>>> getSeenBy(
            @PathVariable String messageId,
            HttpServletRequest req) {

        String userId = extractUserId(req);
        if (userId == null) return ResponseEntity.status(401).build();

        return messageService.getSeenBy(messageId, userId);
    }
}