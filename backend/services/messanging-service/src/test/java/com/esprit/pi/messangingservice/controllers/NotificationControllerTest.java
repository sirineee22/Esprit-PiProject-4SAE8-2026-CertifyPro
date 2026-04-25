package com.esprit.pi.messangingservice.controllers;

import com.esprit.pi.messangingservice.DTO.NotificationDTO;
import com.esprit.pi.messangingservice.Services.NotificationService;
import com.esprit.pi.messangingservice.config.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.ResponseEntity;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT) // ✅ FIX: certains tests n'utilisent pas request ni jwtService
class NotificationControllerTest {

    @Mock NotificationService notifService;
    @Mock JwtService          jwtService;
    @Mock HttpServletRequest  request;

    @InjectMocks NotificationController controller;

    private static final String USER_ID = "user-42";
    private static final String TOKEN   = "valid.token";

    @BeforeEach
    void setupToken() {
        when(request.getHeader("Authorization")).thenReturn("Bearer " + TOKEN);
        when(jwtService.extractUserId(TOKEN)).thenReturn(USER_ID);
    }

    private NotificationDTO buildNotif(String id, boolean read) {
        return NotificationDTO.builder()
                .id(id)
                .recipientId(USER_ID)
                .senderId("sender-1")
                .senderName("Alice")
                .type("MESSAGE")
                .title("New message")
                .body("Hello!")
                .read(read)
                .createdAt(Instant.now())
                .build();
    }

    // ════════════════════════════════════════════════════
    // GET /api/notifications
    // ════════════════════════════════════════════════════

    @Test
    void getAll_returnsNotificationsForUser() {
        List<NotificationDTO> notifs = List.of(buildNotif("n1", false), buildNotif("n2", true));
        when(notifService.getForUser(USER_ID)).thenReturn(notifs);

        ResponseEntity<List<NotificationDTO>> resp = controller.getAll(request);

        assertThat(resp.getStatusCode().value()).isEqualTo(200);
        assertThat(resp.getBody()).hasSize(2);
        verify(notifService).getForUser(USER_ID);
    }

    @Test
    void getAll_withNullToken_returnsBadRequest() {
        when(request.getHeader("Authorization")).thenReturn(null);

        ResponseEntity<List<NotificationDTO>> resp = controller.getAll(request);

        assertThat(resp.getStatusCode().value()).isEqualTo(400);
        verify(notifService, never()).getForUser(any());
    }

    @Test
    void getAll_withNullUserId_returnsBadRequest() {
        when(jwtService.extractUserId(TOKEN)).thenReturn(null);

        ResponseEntity<List<NotificationDTO>> resp = controller.getAll(request);

        assertThat(resp.getStatusCode().value()).isEqualTo(400);
    }

    // ════════════════════════════════════════════════════
    // GET /api/notifications/count
    // ════════════════════════════════════════════════════

    @Test
    void count_returnsUnreadCount() {
        when(notifService.countUnread(USER_ID)).thenReturn(3L);

        ResponseEntity<Map<String, Long>> resp = controller.count(request);

        assertThat(resp.getStatusCode().value()).isEqualTo(200);
        assertThat(resp.getBody()).containsEntry("count", 3L);
    }

    @Test
    void count_returnsZeroWhenNoUnread() {
        when(notifService.countUnread(USER_ID)).thenReturn(0L);

        ResponseEntity<Map<String, Long>> resp = controller.count(request);

        assertThat(resp.getBody()).containsEntry("count", 0L);
    }

    @Test
    void count_withNullUserId_returnsBadRequest() {
        when(jwtService.extractUserId(TOKEN)).thenReturn(null);

        ResponseEntity<Map<String, Long>> resp = controller.count(request);

        assertThat(resp.getStatusCode().value()).isEqualTo(400);
        verify(notifService, never()).countUnread(any());
    }

    // ════════════════════════════════════════════════════
    // PUT /api/notifications/{id}/read — n'utilise pas request/JWT
    // ════════════════════════════════════════════════════

    @Test
    void markRead_callsServiceAndReturnsNoContent() {
        ResponseEntity<Void> resp = controller.markRead("notif-1");

        verify(notifService).markRead("notif-1");
        assertThat(resp.getStatusCode().value()).isEqualTo(204);
    }

    // ════════════════════════════════════════════════════
    // PUT /api/notifications/read-all
    // ════════════════════════════════════════════════════

    @Test
    void markAllRead_callsServiceAndReturnsNoContent() {
        ResponseEntity<Void> resp = controller.markAllRead(request);

        verify(notifService).markAllRead(USER_ID);
        assertThat(resp.getStatusCode().value()).isEqualTo(204);
    }

    @Test
    void markAllRead_withNullUserId_returnsBadRequest() {
        when(jwtService.extractUserId(TOKEN)).thenReturn(null);

        ResponseEntity<Void> resp = controller.markAllRead(request);

        assertThat(resp.getStatusCode().value()).isEqualTo(400);
        verify(notifService, never()).markAllRead(any());
    }

    // ════════════════════════════════════════════════════
    // DELETE /api/notifications/{id} — n'utilise pas request/JWT
    // ════════════════════════════════════════════════════

    @Test
    void delete_callsServiceAndReturnsNoContent() {
        ResponseEntity<Void> resp = controller.delete("notif-1");

        verify(notifService).delete("notif-1");
        assertThat(resp.getStatusCode().value()).isEqualTo(204);
    }

    // ════════════════════════════════════════════════════
    // DELETE /api/notifications
    // ════════════════════════════════════════════════════

    @Test
    void deleteAll_callsServiceAndReturnsNoContent() {
        ResponseEntity<Void> resp = controller.deleteAll(request);

        verify(notifService).deleteAll(USER_ID);
        assertThat(resp.getStatusCode().value()).isEqualTo(204);
    }

    @Test
    void deleteAll_withNullUserId_returnsBadRequest() {
        when(jwtService.extractUserId(TOKEN)).thenReturn(null);

        ResponseEntity<Void> resp = controller.deleteAll(request);

        assertThat(resp.getStatusCode().value()).isEqualTo(400);
        verify(notifService, never()).deleteAll(any());
    }

    @Test
    void deleteAll_withMissingBearerHeader_returnsBadRequest() {
        when(request.getHeader("Authorization")).thenReturn("Token abc");

        ResponseEntity<Void> resp = controller.deleteAll(request);

        assertThat(resp.getStatusCode().value()).isEqualTo(400);
        verify(notifService, never()).deleteAll(any());
    }
}