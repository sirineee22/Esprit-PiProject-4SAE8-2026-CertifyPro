package com.esprit.pi.messangingservice.Services;

import com.esprit.pi.messangingservice.DTO.NotificationDTO;
import com.esprit.pi.messangingservice.entities.Notification;
import com.esprit.pi.messangingservice.repositories.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notifRepo;
    @Mock private SimpMessagingTemplate  messaging;

    @InjectMocks
    private NotificationService notificationService;

    private Notification buildNotif(String id, String recipientId, boolean read) {
        return Notification.builder()
                .id(id)
                .recipientId(recipientId)
                .senderId("sender-1")
                .senderName("Alice")
                .type("message")
                .title("New message")
                .body("Hello!")
                .read(read)
                .deleted(false)
                .createdAt(Instant.now())
                .build();
    }

    // ── getForUser ────────────────────────────────────────────────────────────

    @Test
    void getForUser_returnsNotificationsForRecipient() {
        Notification n1 = buildNotif("n1", "user-1", false);
        Notification n2 = buildNotif("n2", "user-1", true);
        when(notifRepo.findByRecipientIdAndDeletedFalseOrderByCreatedAtDesc("user-1"))
                .thenReturn(List.of(n1, n2));

        List<NotificationDTO> result = notificationService.getForUser("user-1");

        assertEquals(2, result.size());
        assertEquals("n1", result.get(0).getId());
    }

    @Test
    void getForUser_emptyList_returnsEmpty() {
        when(notifRepo.findByRecipientIdAndDeletedFalseOrderByCreatedAtDesc("user-x"))
                .thenReturn(List.of());

        assertTrue(notificationService.getForUser("user-x").isEmpty());
    }

    // ── countUnread ───────────────────────────────────────────────────────────

    @Test
    void countUnread_returnsCorrectCount() {
        when(notifRepo.countByRecipientIdAndReadFalseAndDeletedFalse("user-1")).thenReturn(3L);

        assertEquals(3L, notificationService.countUnread("user-1"));
    }

    @Test
    void countUnread_returnsZeroWhenNone() {
        when(notifRepo.countByRecipientIdAndReadFalseAndDeletedFalse("user-1")).thenReturn(0L);

        assertEquals(0L, notificationService.countUnread("user-1"));
    }

    // ── markRead ──────────────────────────────────────────────────────────────

    @Test
    void markRead_setsReadTrue_andSaves() {
        Notification n = buildNotif("n1", "user-1", false);
        when(notifRepo.findById("n1")).thenReturn(Optional.of(n));
        when(notifRepo.countByRecipientIdAndReadFalseAndDeletedFalse("user-1")).thenReturn(0L);

        notificationService.markRead("n1");

        assertTrue(n.isRead());
        verify(notifRepo).save(n);
    }

    @Test
    void markRead_nonExistentId_doesNothing() {
        when(notifRepo.findById("missing")).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> notificationService.markRead("missing"));
        verify(notifRepo, never()).save(any());
    }

    // ── markAllRead ───────────────────────────────────────────────────────────

    @Test
    void markAllRead_marksAllUnreadAsRead() {
        Notification n1 = buildNotif("n1", "user-1", false);
        Notification n2 = buildNotif("n2", "user-1", false);
        when(notifRepo.findByRecipientIdAndReadFalseAndDeletedFalse("user-1"))
                .thenReturn(List.of(n1, n2));
        when(notifRepo.countByRecipientIdAndReadFalseAndDeletedFalse("user-1")).thenReturn(0L);

        notificationService.markAllRead("user-1");

        assertTrue(n1.isRead());
        assertTrue(n2.isRead());
        verify(notifRepo).saveAll(List.of(n1, n2));
    }

    // ── delete ────────────────────────────────────────────────────────────────

    @Test
    void delete_setsDeletedTrue_andSaves() {
        Notification n = buildNotif("n1", "user-1", false);
        when(notifRepo.findById("n1")).thenReturn(Optional.of(n));
        when(notifRepo.countByRecipientIdAndReadFalseAndDeletedFalse("user-1")).thenReturn(0L);

        notificationService.delete("n1");

        assertTrue(n.isDeleted());
        verify(notifRepo).save(n);
    }

    // ── deleteAll ─────────────────────────────────────────────────────────────

    @Test
    void deleteAll_softDeletesAllForUser() {
        Notification n1 = buildNotif("n1", "user-1", false);
        Notification n2 = buildNotif("n2", "user-1", true);
        when(notifRepo.findByRecipientIdAndDeletedFalseOrderByCreatedAtDesc("user-1"))
                .thenReturn(List.of(n1, n2));
        when(notifRepo.countByRecipientIdAndReadFalseAndDeletedFalse("user-1")).thenReturn(0L);

        notificationService.deleteAll("user-1");

        assertTrue(n1.isDeleted());
        assertTrue(n2.isDeleted());
        verify(notifRepo).saveAll(List.of(n1, n2));
    }

    // ── send ──────────────────────────────────────────────────────────────────

    @Test
    void send_persistsNotificationAndPushesViaWebSocket() {
        when(notifRepo.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));
        when(notifRepo.countByRecipientIdAndReadFalseAndDeletedFalse("user-2")).thenReturn(1L);

        notificationService.send(
                "user-2", "user-1", "Alice", "avatar.png",
                "message", "New message", "Hello!", "room-1", "msg-1"
        );

        ArgumentCaptor<Notification> cap = ArgumentCaptor.forClass(Notification.class);
        verify(notifRepo).save(cap.capture());
        assertEquals("user-2",  cap.getValue().getRecipientId());
        assertEquals("user-1",  cap.getValue().getSenderId());
        assertEquals("message", cap.getValue().getType());
        assertFalse(cap.getValue().isRead());

        // WebSocket push to user topic
        verify(messaging).convertAndSend(
                eq("/topic/notifications/user-2"), any(NotificationDTO.class));
    }

    // ── notifyNewMessage ──────────────────────────────────────────────────────

    @Test
    void notifyNewMessage_truncatesLongBody() {
        when(notifRepo.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));
        when(notifRepo.countByRecipientIdAndReadFalseAndDeletedFalse(any())).thenReturn(0L);

        String longMsg = "A".repeat(100);
        notificationService.notifyNewMessage(
                "user-2", "user-1", "Alice", "avatar.png", longMsg, "room-1", "msg-1");

        ArgumentCaptor<Notification> cap = ArgumentCaptor.forClass(Notification.class);
        verify(notifRepo).save(cap.capture());
        assertTrue(cap.getValue().getBody().length() <= 63); // 60 chars + "…"
    }

    // ── notifyReaction ────────────────────────────────────────────────────────

    @Test
    void notifyReaction_sendsReactionNotification() {
        when(notifRepo.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));
        when(notifRepo.countByRecipientIdAndReadFalseAndDeletedFalse(any())).thenReturn(0L);

        notificationService.notifyReaction(
                "user-2", "user-1", "Alice", "avatar.png", "👍", "room-1", "msg-1");

        ArgumentCaptor<Notification> cap = ArgumentCaptor.forClass(Notification.class);
        verify(notifRepo).save(cap.capture());
        assertEquals("reaction", cap.getValue().getType());
    }
}
