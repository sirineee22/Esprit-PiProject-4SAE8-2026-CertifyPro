package com.esprit.pi.messangingservice.controllers;

import com.esprit.pi.messangingservice.DTO.*;
import com.esprit.pi.messangingservice.Services.ChatUserService;
import com.esprit.pi.messangingservice.Services.MessageService;
import com.esprit.pi.messangingservice.entities.ChatUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatWebSocketController {

    private final MessageService messageService;
    private final ChatUserService userService;
    private final SimpMessagingTemplate messaging;

    // ================= CONNECT =================
    @MessageMapping("/chat.connect")
    public void connect(@Payload ConnectRequest req) {
        if (req == null || req.getUserId() == null) return;

        ChatUser user = userService.connect(req);
        // Broadcast presence update (status + lastSeen) to all clients
        Map<String, Object> presence = buildPresenceEvent(user);
        messaging.convertAndSend("/topic/users.status", presence);
    }

    // ================= DISCONNECT =================
    @MessageMapping("/chat.disconnect")
    public void disconnect(@Payload ConnectRequest req) {
        if (req == null || req.getUserId() == null) return;

        ChatUser user = userService.disconnect(req.getUserId());
        Map<String, Object> presence = buildPresenceEvent(user);
        messaging.convertAndSend("/topic/users.status", presence);
    }

    /** Builds a presence event payload from a ChatUser */
    private Map<String, Object> buildPresenceEvent(ChatUser user) {
        Map<String, Object> ev = new java.util.LinkedHashMap<>();
        ev.put("event",     "PRESENCE");
        ev.put("userId",    user.getUserId());
        ev.put("name",      user.getName());
        ev.put("status",    user.getStatus());
        ev.put("connected", user.isConnected());
        ev.put("lastSeen",  user.getLastSeen() != null ? user.getLastSeen().toString() : null);
        return ev;
    }

    // ================= SEND MESSAGE =================
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload MessageRequest req) {
        if (req == null || req.getChatRoomId() == null) return;

        try {
            var saved = messageService.save(req);
            var dto = messageService.toDto(saved, req.getSenderId());

            messaging.convertAndSend("/topic/room/" + req.getChatRoomId(), dto);

        } catch (Exception e) {
            log.error("sendMessage error: {}", e.getMessage(), e);
        }
    }

    // ================= TYPING =================
    @MessageMapping("/chat.typing")
    public void typing(@Payload Map<String, Object> payload) {

        String chatRoomId = (String) payload.get("chatRoomId");
        if (chatRoomId == null) return;

        Map<String, Object> event = new HashMap<>();
        event.put("event", "typing");
        event.put("userId", payload.getOrDefault("userId", ""));
        event.put("name", payload.getOrDefault("name", ""));
        event.put("chatRoomId", chatRoomId);
        event.put("isTyping", payload.getOrDefault("isTyping", true));

        messaging.convertAndSend("/topic/room/" + chatRoomId + "/typing", event);
    }

    // ================= READ =================
    @MessageMapping("/chat.read")
    public void markRead(@Payload Map<String, String> payload) {
        if (payload == null) return;

        String messageId = payload.get("messageId");
        String userId = payload.get("userId");

        if (messageId == null || userId == null) return;

        messageService.markAsRead(messageId, userId);
    }

    @MessageMapping("/chat.readAll")
    public void markAllRead(@Payload Map<String, String> payload) {
        if (payload == null) return;

        String chatRoomId = payload.get("chatRoomId");
        String userId = payload.get("userId");

        if (chatRoomId == null || userId == null) return;

        messageService.markAllAsRead(chatRoomId, userId);
    }

    // ================= REACTIONS (FIXED + SAFE) =================
    @MessageMapping("/chat.react")
    public void react(@Payload Map<String, String> payload) {

        String messageId = payload.get("messageId");
        String emoji = payload.get("emoji");
        String userId = payload.get("userId");
        String chatRoomId = payload.get("chatRoomId");

        if (messageId == null || emoji == null || userId == null) return;

        try {
            ReactionRequest req = new ReactionRequest();
            req.setEmoji(emoji);
            req.setUserId(userId);

            var dto = messageService.addReaction(messageId, req);

            Map<String, Object> event = new HashMap<>();
            event.put("event", "REACTION");
            event.put("messageId", messageId);
            event.put("reactions", dto.getReactions());

            String room = (chatRoomId != null)
                    ? chatRoomId
                    : dto.getChatRoomId();

            messaging.convertAndSend("/topic/room/" + room, event);

        } catch (Exception e) {
            log.error("react error: {}", e.getMessage(), e);
        }
    }

    // ═══════════════════════════════════════════════════════
    // WebRTC SIGNALING — relay peer-to-peer via WebSocket
    // ═══════════════════════════════════════════════════════

    // ═══════════════════════════════════════════════════════
    // HELPER — extraire une valeur comme String (gère Integer et String)
    // ═══════════════════════════════════════════════════════
    private String getString(Map<String, Object> payload, String key) {
        Object val = payload.get(key);
        return val != null ? val.toString() : null;
    }

    /**
     * Initier un appel.
     */
    @MessageMapping("/call.offer")
    public void callOffer(@Payload Map<String, Object> payload) {
        String chatRoomId = getString(payload, "chatRoomId");
        String to         = getString(payload, "to");
        if (to == null) return;
        payload.put("event", "CALL_OFFER");
        log.info("📞 call.offer from={} to={} room={}", getString(payload,"from"), to, chatRoomId);
        if (chatRoomId != null && !chatRoomId.isBlank()) {
            messaging.convertAndSend("/topic/room/" + chatRoomId, payload);
        }
        messaging.convertAndSend("/topic/user/" + to, payload);
    }

    /**
     * Répondre à un appel.
     */
    @MessageMapping("/call.answer")
    public void callAnswer(@Payload Map<String, Object> payload) {
        String chatRoomId = getString(payload, "chatRoomId");
        String to         = getString(payload, "to");
        if (to == null) return;
        payload.put("event", "CALL_ANSWER");
        log.info("✅ call.answer from={} to={} room={}", getString(payload,"from"), to, chatRoomId);
        if (chatRoomId != null && !chatRoomId.isBlank()) {
            messaging.convertAndSend("/topic/room/" + chatRoomId, payload);
        }
        messaging.convertAndSend("/topic/user/" + to, payload);
    }

    /**
     * Échange de candidats ICE.
     */
    @MessageMapping("/call.ice")
    public void callIce(@Payload Map<String, Object> payload) {
        String chatRoomId = getString(payload, "chatRoomId");
        String to         = getString(payload, "to");
        if (to == null) return;
        payload.put("event", "CALL_ICE");
        if (chatRoomId != null && !chatRoomId.isBlank()) {
            messaging.convertAndSend("/topic/room/" + chatRoomId, payload);
        }
        messaging.convertAndSend("/topic/user/" + to, payload);
    }

    /**
     * Terminer / refuser un appel.
     */
    @MessageMapping("/call.end")
    public void callEnd(@Payload Map<String, Object> payload) {
        String chatRoomId = getString(payload, "chatRoomId");
        String to         = getString(payload, "to");
        if (to == null) return;
        payload.put("event", "CALL_END");
        log.info("📵 call.end from={} to={} reason={}", getString(payload,"from"), to, getString(payload,"reason"));
        if (chatRoomId != null && !chatRoomId.isBlank()) {
            messaging.convertAndSend("/topic/room/" + chatRoomId, payload);
        }
        messaging.convertAndSend("/topic/user/" + to, payload);
    }
}