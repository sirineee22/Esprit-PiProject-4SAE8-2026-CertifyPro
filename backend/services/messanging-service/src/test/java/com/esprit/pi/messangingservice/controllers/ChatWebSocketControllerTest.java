package com.esprit.pi.messangingservice.controllers;

import com.esprit.pi.messangingservice.DTO.*;
import com.esprit.pi.messangingservice.Services.ChatUserService;
import com.esprit.pi.messangingservice.Services.MessageService;
import com.esprit.pi.messangingservice.entities.ChatUser;
import com.esprit.pi.messangingservice.entities.Message;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatWebSocketControllerTest {

    @Mock MessageService       messageService;
    @Mock ChatUserService      userService;
    @Mock SimpMessagingTemplate messaging;

    @InjectMocks ChatWebSocketController controller;

    // ════════════════════════════════════════════════════
    // connect
    // ════════════════════════════════════════════════════

    @Test
    void connect_broadcastsUserStatus() {
        ConnectRequest req = new ConnectRequest();
        req.setUserId("user-1");
        req.setName("Alice");

        ChatUser user = new ChatUser();
        user.setUserId("user-1");
        user.setName("Alice");
        user.setStatus("online");
        when(userService.connect(req)).thenReturn(user);

        controller.connect(req);

        verify(userService).connect(req);
        // Controller sends a Map with event=PRESENCE, not the ChatUser directly
        ArgumentCaptor<Map> captor = ArgumentCaptor.forClass(Map.class);
        verify(messaging).convertAndSend(eq("/topic/users.status"), captor.capture());
        assertThat(captor.getValue().get("event")).isEqualTo("PRESENCE");
        assertThat(captor.getValue().get("userId")).isEqualTo("user-1");
        assertThat(captor.getValue().get("status")).isEqualTo("online");
    }

    @Test
    void connect_withNullRequest_doesNothing() {
        controller.connect(null);

        verify(userService, never()).connect(any());
        verify(messaging, never()).convertAndSend(anyString(), any(Object.class));
    }

    @Test
    void connect_withNullUserId_doesNothing() {
        ConnectRequest req = new ConnectRequest();
        req.setUserId(null);

        controller.connect(req);

        verify(userService, never()).connect(any());
    }

    // ════════════════════════════════════════════════════
    // disconnect
    // ════════════════════════════════════════════════════

    @Test
    void disconnect_broadcastsOfflineStatus() {
        ConnectRequest req = new ConnectRequest();
        req.setUserId("user-1");

        ChatUser user = new ChatUser();
        user.setUserId("user-1");
        user.setStatus("offline");
        when(userService.disconnect("user-1")).thenReturn(user);

        controller.disconnect(req);

        verify(userService).disconnect("user-1");
        // Controller sends a Map with event=PRESENCE
        ArgumentCaptor<Map> captor = ArgumentCaptor.forClass(Map.class);
        verify(messaging).convertAndSend(eq("/topic/users.status"), captor.capture());
        assertThat(captor.getValue().get("event")).isEqualTo("PRESENCE");
        assertThat(captor.getValue().get("userId")).isEqualTo("user-1");
        assertThat(captor.getValue().get("status")).isEqualTo("offline");
    }

    @Test
    void disconnect_withNullRequest_doesNothing() {
        controller.disconnect(null);

        verify(userService, never()).disconnect(anyString());
    }

    @Test
    void disconnect_withNullUserId_doesNothing() {
        ConnectRequest req = new ConnectRequest();
        req.setUserId(null);

        controller.disconnect(req);

        verify(userService, never()).disconnect(anyString());
    }

    // ════════════════════════════════════════════════════
    // sendMessage
    // ════════════════════════════════════════════════════

    @Test
    void sendMessage_savesAndBroadcastsToRoom() {
        MessageRequest req = new MessageRequest();
        req.setChatRoomId("room-1");
        req.setSenderId("user-1");
        req.setMessage("Hello!");

        Message saved = new Message();
        saved.setId("msg-1");

        ChatMessageResponse dto = new ChatMessageResponse();
        dto.setId("msg-1");
        dto.setChatRoomId("room-1");

        when(messageService.save(req)).thenReturn(saved);
        when(messageService.toDto(saved, "user-1")).thenReturn(dto);

        controller.sendMessage(req);

        verify(messageService).save(req);
        verify(messageService).toDto(saved, "user-1");
        verify(messaging).convertAndSend("/topic/room/room-1", dto);
    }

    @Test
    void sendMessage_withNullRequest_doesNothing() {
        controller.sendMessage(null);

        verify(messageService, never()).save(any());
        verify(messaging, never()).convertAndSend(anyString(), any(Object.class));
    }

    @Test
    void sendMessage_withNullRoomId_doesNothing() {
        MessageRequest req = new MessageRequest();
        req.setChatRoomId(null);

        controller.sendMessage(req);

        verify(messageService, never()).save(any());
    }

    @Test
    void sendMessage_whenServiceThrows_doesNotPropagate() {
        MessageRequest req = new MessageRequest();
        req.setChatRoomId("room-1");
        req.setSenderId("user-1");

        when(messageService.save(req)).thenThrow(new RuntimeException("DB error"));

        assertThatCode(() -> controller.sendMessage(req)).doesNotThrowAnyException();
        verify(messaging, never()).convertAndSend(anyString(), any(Object.class));
    }

    // ════════════════════════════════════════════════════
    // typing
    // ════════════════════════════════════════════════════

    @Test
    void typing_broadcastsTypingEventToRoom() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("chatRoomId", "room-1");
        payload.put("userId", "user-1");
        payload.put("name", "Alice");
        payload.put("isTyping", true);

        controller.typing(payload);

        ArgumentCaptor<Map> captor = ArgumentCaptor.forClass(Map.class);
        verify(messaging).convertAndSend(eq("/topic/room/room-1/typing"), captor.capture());

        Map<String, Object> event = captor.getValue();
        assertThat(event.get("event")).isEqualTo("typing");
        assertThat(event.get("userId")).isEqualTo("user-1");
        assertThat(event.get("name")).isEqualTo("Alice");
        assertThat(event.get("chatRoomId")).isEqualTo("room-1");
        assertThat(event.get("isTyping")).isEqualTo(true);
    }

    @Test
    void typing_withNullRoomId_doesNothing() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("chatRoomId", null);

        controller.typing(payload);

        verify(messaging, never()).convertAndSend(anyString(), any(Object.class));
    }

    @Test
    void typing_withMissingFields_usesDefaults() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("chatRoomId", "room-1");
        // no userId, name or isTyping

        controller.typing(payload);

        ArgumentCaptor<Map> captor = ArgumentCaptor.forClass(Map.class);
        verify(messaging).convertAndSend(eq("/topic/room/room-1/typing"), captor.capture());

        Map<String, Object> event = captor.getValue();
        assertThat(event.get("userId")).isEqualTo("");
        assertThat(event.get("name")).isEqualTo("");
        assertThat(event.get("isTyping")).isEqualTo(true);
    }

    // ════════════════════════════════════════════════════
    // markRead
    // ════════════════════════════════════════════════════

    @Test
    void markRead_callsServiceWithCorrectParams() {
        Map<String, String> payload = Map.of("messageId", "msg-1", "userId", "user-1");

        controller.markRead(payload);

        verify(messageService).markAsRead("msg-1", "user-1");
    }

    @Test
    void markRead_withNullMessageId_doesNothing() {
        Map<String, String> payload = new HashMap<>();
        payload.put("messageId", null);
        payload.put("userId", "user-1");

        controller.markRead(payload);

        verify(messageService, never()).markAsRead(anyString(), anyString());
    }

    @Test
    void markRead_withNullUserId_doesNothing() {
        Map<String, String> payload = new HashMap<>();
        payload.put("messageId", "msg-1");
        payload.put("userId", null);

        controller.markRead(payload);

        verify(messageService, never()).markAsRead(anyString(), anyString());
    }

    // ════════════════════════════════════════════════════
    // markAllRead
    // ════════════════════════════════════════════════════

    @Test
    void markAllRead_callsServiceWithCorrectParams() {
        Map<String, String> payload = Map.of("chatRoomId", "room-1", "userId", "user-1");

        controller.markAllRead(payload);

        verify(messageService).markAllAsRead("room-1", "user-1");
    }

    @Test
    void markAllRead_withNullRoomId_doesNothing() {
        Map<String, String> payload = new HashMap<>();
        payload.put("chatRoomId", null);
        payload.put("userId", "user-1");

        controller.markAllRead(payload);

        verify(messageService, never()).markAllAsRead(anyString(), anyString());
    }

    // ════════════════════════════════════════════════════
    // react (WebSocket)
    // ════════════════════════════════════════════════════

    @Test
    void react_addsReactionAndBroadcastsEvent() {
        Map<String, String> payload = new HashMap<>();
        payload.put("messageId", "msg-1");
        payload.put("emoji", "👍");
        payload.put("userId", "user-1");
        payload.put("chatRoomId", "room-1");

        ChatMessageResponse dto = new ChatMessageResponse();
        dto.setId("msg-1");
        dto.setChatRoomId("room-1");
        dto.setReactions(List.of(Map.of("emoji", "👍", "userId", "user-1")));

        when(messageService.addReaction(eq("msg-1"), any(ReactionRequest.class))).thenReturn(dto);

        controller.react(payload);

        ArgumentCaptor<ReactionRequest> reqCap = ArgumentCaptor.forClass(ReactionRequest.class);
        verify(messageService).addReaction(eq("msg-1"), reqCap.capture());
        assertThat(reqCap.getValue().getEmoji()).isEqualTo("👍");
        assertThat(reqCap.getValue().getUserId()).isEqualTo("user-1");

        ArgumentCaptor<Map> eventCap = ArgumentCaptor.forClass(Map.class);
        verify(messaging).convertAndSend(eq("/topic/room/room-1"), eventCap.capture());
        assertThat(eventCap.getValue().get("event")).isEqualTo("REACTION");
        assertThat(eventCap.getValue().get("messageId")).isEqualTo("msg-1");
    }

    @Test
    void react_withNullMessageId_doesNothing() {
        Map<String, String> payload = new HashMap<>();
        payload.put("messageId", null);
        payload.put("emoji", "👍");
        payload.put("userId", "user-1");

        controller.react(payload);

        verify(messageService, never()).addReaction(anyString(), any());
    }

    @Test
    void react_withNullEmoji_doesNothing() {
        Map<String, String> payload = new HashMap<>();
        payload.put("messageId", "msg-1");
        payload.put("emoji", null);
        payload.put("userId", "user-1");

        controller.react(payload);

        verify(messageService, never()).addReaction(anyString(), any());
    }

    @Test
    void react_whenServiceThrows_doesNotPropagate() {
        Map<String, String> payload = new HashMap<>();
        payload.put("messageId", "msg-1");
        payload.put("emoji", "👍");
        payload.put("userId", "user-1");
        payload.put("chatRoomId", "room-1");

        when(messageService.addReaction(anyString(), any())).thenThrow(new RuntimeException("error"));

        assertThatCode(() -> controller.react(payload)).doesNotThrowAnyException();
    }

    @Test
    void react_usesDtoChatRoomIdWhenPayloadRoomIdIsNull() {
        Map<String, String> payload = new HashMap<>();
        payload.put("messageId", "msg-1");
        payload.put("emoji", "❤️");
        payload.put("userId", "user-1");
        // chatRoomId intentionally absent

        ChatMessageResponse dto = new ChatMessageResponse();
        dto.setId("msg-1");
        dto.setChatRoomId("room-from-dto");
        dto.setReactions(List.of());

        when(messageService.addReaction(anyString(), any())).thenReturn(dto);

        controller.react(payload);

        // Controller broadcasts to /topic/room/{room-from-dto} when payload has no chatRoomId
        ArgumentCaptor<Map> cap = ArgumentCaptor.forClass(Map.class);
        verify(messaging).convertAndSend(eq("/topic/room/room-from-dto"), cap.capture());
        assertThat(cap.getValue().get("event")).isEqualTo("REACTION");
        assertThat(cap.getValue().get("messageId")).isEqualTo("msg-1");
    }
}