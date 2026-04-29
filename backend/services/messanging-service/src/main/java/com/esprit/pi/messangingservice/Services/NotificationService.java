package com.esprit.pi.messangingservice.Services;

import com.esprit.pi.messangingservice.DTO.NotificationDTO;
import com.esprit.pi.messangingservice.entities.Notification;
import com.esprit.pi.messangingservice.repositories.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notifRepo;
    private final SimpMessagingTemplate  messaging;

    // ══════════════════════════════════════════════════════
    // CRÉER & ENVOYER une notification
    // ══════════════════════════════════════════════════════

    /**
     * Crée une notification en DB et la pousse en temps réel
     * vers le destinataire via WebSocket.
     *
     * Topic : /topic/notifications/{recipientId}
     */
    public Notification send(String recipientId,
                             String senderId,
                             String senderName,
                             String senderAvatar,
                             String type,
                             String title,
                             String body,
                             String chatRoomId,
                             String messageId) {

        String icon = iconForType(type);

        Notification notif = Notification.builder()
                .recipientId(recipientId)
                .senderId(senderId)
                .senderName(senderName)
                .senderAvatar(senderAvatar)
                .type(type)
                .title(title)
                .body(body)
                .icon(icon)
                .chatRoomId(chatRoomId)
                .messageId(messageId)
                .routerLink("/chat")
                .read(false)
                .deleted(false)
                .createdAt(Instant.now())
                .build();

        Notification saved = notifRepo.save(notif);

        // Push temps réel WebSocket → /topic/notifications/{recipientId}
        messaging.convertAndSend(
                "/topic/notifications/" + recipientId,
                toDTO(saved)
        );

        // Met à jour le badge (compteur non-lus)
        long unreadCount = notifRepo.countByRecipientIdAndReadFalseAndDeletedFalse(recipientId);
        messaging.convertAndSend(
                "/topic/notifications/" + recipientId + "/count",
                Map.of("count", unreadCount)
        );

        log.info("🔔 Notification envoyée → {} | type={} | body={}", recipientId, type, body);
        return saved;
    }

    // ══════════════════════════════════════════════════════
    // RACCOURCIS PAR TYPE
    // ══════════════════════════════════════════════════════

    /** Notif pour nouveau message reçu */
    public void notifyNewMessage(String recipientId, String senderId, String senderName,
                                 String senderAvatar, String messageText, String chatRoomId, String messageId) {
        String body = messageText != null && messageText.length() > 60
                ? messageText.substring(0, 60) + "…" : messageText;
        send(recipientId, senderId, senderName, senderAvatar,
                "message", "💬 " + senderName, body, chatRoomId, messageId);
    }

    /** Notif pour réaction reçue */
    public void notifyReaction(String recipientId, String senderId, String senderName,
                               String senderAvatar, String emoji, String chatRoomId, String messageId) {
        send(recipientId, senderId, senderName, senderAvatar,
                "reaction", "😀 Réaction de " + senderName,
                senderName + " a réagi " + emoji + " à votre message",
                chatRoomId, messageId);
    }

    /** Notif pour fichier reçu */
    public void notifyFile(String recipientId, String senderId, String senderName,
                           String senderAvatar, String fileName, String chatRoomId, String messageId) {
        send(recipientId, senderId, senderName, senderAvatar,
                "file", "📎 Fichier de " + senderName,
                senderName + " a envoyé : " + fileName,
                chatRoomId, messageId);
    }

    /** Notif pour localisation partagée */
    public void notifyLocation(String recipientId, String senderId, String senderName,
                               String senderAvatar, String chatRoomId, String messageId) {
        send(recipientId, senderId, senderName, senderAvatar,
                "location", "📍 Position de " + senderName,
                senderName + " a partagé sa position",
                chatRoomId, messageId);
    }

    // ══════════════════════════════════════════════════════
    // LECTURE / SUPPRESSION
    // ══════════════════════════════════════════════════════

    /** Liste des notifs d'un utilisateur (non supprimées) */
    public List<NotificationDTO> getForUser(String userId) {
        return notifRepo
                .findByRecipientIdAndDeletedFalseOrderByCreatedAtDesc(userId)
                .stream().map(this::toDTO).toList();
    }

    /** Nombre de non-lues */
    public long countUnread(String userId) {
        return notifRepo.countByRecipientIdAndReadFalseAndDeletedFalse(userId);
    }

    /** Marquer UNE notification comme lue */
    public void markRead(String notifId) {
        notifRepo.findById(notifId).ifPresent(n -> {
            n.setRead(true);
            notifRepo.save(n);
            pushCount(n.getRecipientId());
        });
    }

    /** Marquer TOUTES les notifications d'un user comme lues */
    public void markAllRead(String userId) {
        List<Notification> unread =
                notifRepo.findByRecipientIdAndReadFalseAndDeletedFalse(userId);
        unread.forEach(n -> n.setRead(true));
        notifRepo.saveAll(unread);
        pushCount(userId);
    }

    /** Supprimer une notification */
    public void delete(String notifId) {
        notifRepo.findById(notifId).ifPresent(n -> {
            n.setDeleted(true);
            notifRepo.save(n);
            pushCount(n.getRecipientId());
        });
    }

    /** Supprimer toutes pour un user */
    public void deleteAll(String userId) {
        List<Notification> all =
                notifRepo.findByRecipientIdAndDeletedFalseOrderByCreatedAtDesc(userId);
        all.forEach(n -> n.setDeleted(true));
        notifRepo.saveAll(all);
        pushCount(userId);
    }

    // ══════════════════════════════════════════════════════
    // HELPERS
    // ══════════════════════════════════════════════════════

    private void pushCount(String userId) {
        long count = notifRepo.countByRecipientIdAndReadFalseAndDeletedFalse(userId);
        messaging.convertAndSend(
                "/topic/notifications/" + userId + "/count",
                Map.of("count", count)
        );
    }

    private String iconForType(String type) {
        return switch (type != null ? type : "system") {
            case "message"  -> "💬";
            case "reaction" -> "😀";
            case "file"     -> "📎";
            case "location" -> "📍";
            case "mention"  -> "@";
            default         -> "🔔";
        };
    }

    public NotificationDTO toDTO(Notification n) {
        return NotificationDTO.builder()
                .id(n.getId())
                .recipientId(n.getRecipientId())
                .senderId(n.getSenderId())
                .senderName(n.getSenderName())
                .senderAvatar(n.getSenderAvatar())
                .type(n.getType())
                .title(n.getTitle())
                .body(n.getBody())
                .icon(n.getIcon())
                .chatRoomId(n.getChatRoomId())
                .messageId(n.getMessageId())
                .routerLink(n.getRouterLink())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}