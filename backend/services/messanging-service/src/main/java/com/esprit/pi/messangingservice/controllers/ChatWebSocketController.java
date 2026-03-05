package com.esprit.pi.messangingservice.controllers;

import com.esprit.pi.messangingservice.DTO.ConnectRequest;
import com.esprit.pi.messangingservice.DTO.MessageRequest;
import com.esprit.pi.messangingservice.DTO.ChatMessageResponse;
import com.esprit.pi.messangingservice.DTO.ReactionRequest;
import com.esprit.pi.messangingservice.Services.ChatUserService;
import com.esprit.pi.messangingservice.Services.MessageService;
import com.esprit.pi.messangingservice.entities.ChatUser;
import com.esprit.pi.messangingservice.entities.Message;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import java.util.Map;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatWebSocketController {

    private final MessageService        messageService;
    private final ChatUserService       userService;
    private final SimpMessagingTemplate messaging;

    // ── Connexion ──
    @MessageMapping("/chat.connect")
    public void connect(@Payload ConnectRequest req) {
        if (req == null || req.getUserId() == null) return;
        ChatUser user = userService.connect(req);
        messaging.convertAndSend("/topic/users.status", user);
    }

    // ── Déconnexion ──
    @MessageMapping("/chat.disconnect")
    public void disconnect(@Payload ConnectRequest req) {
        if (req == null || req.getUserId() == null) return;
        ChatUser user = userService.disconnect(req.getUserId());
        messaging.convertAndSend("/topic/users.status", user);
    }

    // ── Envoi message ──
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload MessageRequest req) {
        if (req == null || req.getChatRoomId() == null) return;
        try {
            Message saved = messageService.save(req);
            ChatMessageResponse dto = messageService.toDto(saved, req.getSenderId());
            messaging.convertAndSend("/topic/room/" + req.getChatRoomId(), dto);
        } catch (Exception e) {
            log.error("❌ Erreur WebSocket sendMessage : {}", e.getMessage(), e);
        }
    }

    // ── Typing ──
    @MessageMapping("/chat.typing")
    public void typing(@Payload Map<String, Object> payload) {
        String chatRoomId = (String) payload.get("chatRoomId");
        if (chatRoomId == null) return;
        Map<String, Object> event = Map.of(
                "event",      "typing",
                "userId",     payload.getOrDefault("userId", ""),
                "name",       payload.getOrDefault("name", ""),
                "chatRoomId", chatRoomId,
                "isTyping",   payload.getOrDefault("isTyping", true)
        );
        messaging.convertAndSend("/topic/room/" + chatRoomId + "/typing", event);
    }

    // ── Read ──
    @MessageMapping("/chat.read")
    public void markRead(@Payload Map<String, String> payload) {
        String messageId = payload.get("messageId");
        String userId    = payload.get("userId");
        if (messageId == null || userId == null) return;
        messageService.markAsRead(messageId, userId);
    }

    @MessageMapping("/chat.readAll")
    public void markAllRead(@Payload Map<String, String> payload) {
        String chatRoomId = payload.get("chatRoomId");
        String userId     = payload.get("userId");
        if (chatRoomId == null || userId == null) return;
        messageService.markAllAsRead(chatRoomId, userId);
    }

    // ════════════════════════════════════════════════════
    // ✅ RÉACTIONS via WebSocket
    // Frontend envoie vers : /app/chat.react
    // Payload : { messageId, emoji, userId, chatRoomId }
    // ════════════════════════════════════════════════════
    @MessageMapping("/chat.react")
    public void react(@Payload Map<String, String> payload) {
        String messageId  = payload.get("messageId");
        String emoji      = payload.get("emoji");
        String userId     = payload.get("userId");
        String chatRoomId = payload.get("chatRoomId");
        if (messageId == null || emoji == null || userId == null) return;

        try {
            ReactionRequest req = new ReactionRequest();
            req.setEmoji(emoji);
            req.setUserId(userId);

            // ✅ addReaction broadcast déjà via messaging dans MessageService
            ChatMessageResponse dto = messageService.addReaction(messageId, req);

            // ✅ Envoyer event spécial REACTION pour que le frontend le reconnaisse
            Map<String, Object> event = new java.util.HashMap<>();
            event.put("event",     "REACTION");
            event.put("messageId", messageId);
            event.put("reactions", dto.getReactions());
            event.put("chatRoomId", chatRoomId != null ? chatRoomId : dto.getChatRoomId());

            messaging.convertAndSend("/topic/room/" + (chatRoomId != null ? chatRoomId : dto.getChatRoomId()), event);

        } catch (Exception e) {
            log.error("❌ Erreur WebSocket react : {}", e.getMessage(), e);
        }
    }
}