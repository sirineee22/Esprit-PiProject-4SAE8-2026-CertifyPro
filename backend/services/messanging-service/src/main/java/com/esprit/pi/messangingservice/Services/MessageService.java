package com.esprit.pi.messangingservice.Services;

import com.esprit.pi.messangingservice.DTO.*;
import com.esprit.pi.messangingservice.entities.ChatUser;
import com.esprit.pi.messangingservice.entities.Message;
import com.esprit.pi.messangingservice.repositories.ChatRoomRepository;
import com.esprit.pi.messangingservice.repositories.ChatUserRepository;
import com.esprit.pi.messangingservice.repositories.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageService {

    private final MessageRepository     messageRepository;
    private final ChatRoomRepository    chatRoomRepository;
    private final ChatUserRepository    chatUserRepository;
    private final SimpMessagingTemplate messaging;
    private final FileStorageService    fileStorage;
    private final NotificationService   notificationService;

    private static final DateTimeFormatter TIME_FMT =
            DateTimeFormatter.ofPattern("h:mm a").withZone(ZoneId.systemDefault());

    // ══════════════════════════════════════════════════════
    // SAVE MESSAGE
    // ══════════════════════════════════════════════════════

    public Message save(MessageRequest req) {
        if (req.getChatRoomId() == null || req.getSenderId() == null) {
            log.error("❌ MessageRequest invalide : chatRoomId ou senderId manquant");
            throw new IllegalArgumentException("chatRoomId et senderId sont requis");
        }

        String senderName = resolveSenderName(req.getSenderId(), req.getName());
        String time       = TIME_FMT.format(Instant.now());

        List<String> mentionedIds = extractMentions(req.getMessage(), req.getChatRoomId());

        Message msg = Message.builder()
                .chatRoomId(req.getChatRoomId())
                .senderId(req.getSenderId())
                .name(senderName)
                .profile(req.getProfile() != null ? req.getProfile() : "")
                .message(req.getMessage() != null ? req.getMessage() : "")
                // ✅ FIX : align toujours "left" en base — le frontend recalcule selon senderId
                .align("left")
                .time(time)
                .type(req.getType() != null ? req.getType() : "text")
                .fileUrl(req.getFileUrl())
                .fileName(req.getFileName())
                .fileSize(req.getFileSize())
                .fileMimeType(req.getFileMimeType())
                .latitude(req.getLatitude())
                .longitude(req.getLongitude())
                .locationUrl(req.getLocationUrl())
                .replyToId(req.getReplyToId())
                .image(req.getImage() != null ? req.getImage() : new ArrayList<>())
                .deleted(false)
                .mentionedUserIds(mentionedIds != null ? mentionedIds : new ArrayList<>())
                .reactions(new ArrayList<>())
                .readBy(new HashSet<>())
                .pinned(false)
                .createdAt(Instant.now())
                .build();

        if (req.getReplyToId() != null) enrichReply(msg, req.getReplyToId());

        try {
            Message saved = messageRepository.save(msg);
            updateRoomLastMessage(req.getChatRoomId(), req.getMessage(), senderName);

            if (!mentionedIds.isEmpty()) {
                notifyMentions(saved, mentionedIds);
            }

            // 🔔 Notifier les autres membres du room
            notifyRoomMembers(saved);

            log.info("✅ Message sauvegardé : id={}, type={}", saved.getId(), saved.getType());
            return saved;

        } catch (Exception e) {
            log.error("❌ Échec sauvegarde message : {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de la sauvegarde du message", e);
        }
    }

    // ══════════════════════════════════════════════════════
    // STATUT DE LECTURE
    // ══════════════════════════════════════════════════════

    public void markAsRead(String messageId, String userId) {
        messageRepository.findById(messageId).ifPresent(msg -> {
            if (msg.getReadBy() == null) msg.setReadBy(new HashSet<>());
            if (!msg.getReadBy().contains(userId)) {
                msg.getReadBy().add(userId);
                messageRepository.save(msg);

                Map<String, Object> event = new HashMap<>();
                event.put("event",     "READ_RECEIPT");
                event.put("messageId", messageId);
                event.put("userId",    userId);
                event.put("readBy",    msg.getReadBy());
                event.put("readCount", msg.getReadBy().size());

                messaging.convertAndSend("/topic/room/" + msg.getChatRoomId(), event);
                log.debug("✓✓ Message {} lu par {}", messageId, userId);
            }
        });
    }

    public void markAllAsRead(String chatRoomId, String userId) {
        List<Message> messages = messageRepository
                .findByChatRoomIdAndDeletedFalseOrderByCreatedAtAsc(chatRoomId);

        messages.forEach(msg -> {
            if (msg.getReadBy() == null) msg.setReadBy(new HashSet<>());
            if (!msg.getReadBy().contains(userId)) {
                msg.getReadBy().add(userId);
            }
        });

        messageRepository.saveAll(messages);

        Map<String, Object> event = new HashMap<>();
        event.put("event",      "ALL_READ");
        event.put("chatRoomId", chatRoomId);
        event.put("userId",     userId);

        messaging.convertAndSend("/topic/room/" + chatRoomId, event);
        log.info("✓✓ Tous les messages du room {} marqués lus par {}", chatRoomId, userId);
    }

    // ══════════════════════════════════════════════════════
    // MESSAGES ÉPINGLÉS
    // ══════════════════════════════════════════════════════

    public ChatMessageResponse togglePin(String messageId, String userId) {
        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message introuvable : " + messageId));

        boolean nowPinned = !msg.isPinned();
        msg.setPinned(nowPinned);
        msg.setPinnedBy(nowPinned ? userId : null);
        msg.setPinnedAt(nowPinned ? Instant.now() : null);

        Message saved = messageRepository.save(msg);

        ChatMessageResponse dto = toDto(saved, userId);
        Map<String, Object> event = new HashMap<>();
        event.put("event",     nowPinned ? "MESSAGE_PINNED" : "MESSAGE_UNPINNED");
        event.put("messageId", messageId);
        event.put("pinned",    nowPinned);
        event.put("pinnedBy",  userId);

        messaging.convertAndSend("/topic/room/" + msg.getChatRoomId(), event);
        log.info("📌 Message {} {} par {}", messageId, nowPinned ? "épinglé" : "désépinglé", userId);
        return dto;
    }

    public List<ChatMessageResponse> getPinnedMessages(String chatRoomId, String currentUserId) {
        return messageRepository
                .findByChatRoomIdAndPinnedTrueAndDeletedFalse(chatRoomId)
                .stream()
                .map(m -> toDto(m, currentUserId))
                .toList();
    }

    // ══════════════════════════════════════════════════════
    // MENTIONS
    // ══════════════════════════════════════════════════════

    private List<String> extractMentions(String text, String chatRoomId) {
        if (text == null || !text.contains("@")) return new ArrayList<>();

        List<String> mentionedIds = new ArrayList<>();
        Pattern pattern = Pattern.compile("@(\\w+)");
        java.util.regex.Matcher matcher = pattern.matcher(text);

        while (matcher.find()) {
            String mentionedName = matcher.group(1);
            chatUserRepository.findByNameIgnoreCase(mentionedName)
                    .ifPresent(u -> mentionedIds.add(u.getUserId()));
        }

        return mentionedIds;
    }

    private void notifyMentions(Message msg, List<String> mentionedUserIds) {
        mentionedUserIds.stream()
                .filter(uid -> !uid.equals(msg.getSenderId()))
                .forEach(uid -> {
                    // Notification persistée + push WebSocket via NotificationService
                    notificationService.send(
                            uid,
                            msg.getSenderId(),
                            msg.getName(),
                            resolveAvatarById(msg.getSenderId()),
                            "mention",
                            "@ Mention de " + msg.getName(),
                            msg.getMessage(),
                            msg.getChatRoomId(),
                            msg.getId()
                    );
                    log.info("🔔 Mention envoyée à {} dans room {}", uid, msg.getChatRoomId());
                });
    }

    /** Notifie tous les membres du room pour un message texte (sauf l'expéditeur) */
    private void notifyRoomMembers(Message msg) {
        getRoomMembersExcept(msg.getChatRoomId(), msg.getSenderId()).forEach(memberId ->
                notificationService.notifyNewMessage(
                        memberId,
                        msg.getSenderId(),
                        msg.getName(),
                        resolveAvatarById(msg.getSenderId()),
                        msg.getMessage(),
                        msg.getChatRoomId(),
                        msg.getId()
                )
        );
    }

    /** Retourne les IDs des membres du room sauf un userId donné */
    private List<String> getRoomMembersExcept(String chatRoomId, String excludeUserId) {
        return chatRoomRepository.findById(chatRoomId)
                .map(room -> {
                    Set<String> members = room.getMemberIds();
                    if (members == null) return new ArrayList<String>();
                    return members.stream()
                            .filter(id -> !id.equals(excludeUserId))
                            .toList();
                })
                .orElse(new ArrayList<>());
    }

    private String resolveNameById(String userId) {
        return chatUserRepository.findByUserId(userId)
                .map(ChatUser::getName)
                .orElse("Utilisateur");
    }

    private String resolveAvatarById(String userId) {
        return chatUserRepository.findByUserId(userId)
                .map(ChatUser::getUserId)
                .orElse("");
    }

    // ══════════════════════════════════════════════════════
    // RECHERCHE
    // ══════════════════════════════════════════════════════

    public List<ChatMessageResponse> searchMessages(String chatRoomId, String keyword, String currentUserId) {
        if (keyword == null || keyword.trim().length() < 2) return new ArrayList<>();
        return messageRepository
                .searchInRoom(chatRoomId, keyword.trim())
                .stream()
                .map(m -> toDto(m, currentUserId))
                .toList();
    }

    public List<ChatMessageResponse> searchGlobal(String keyword, String currentUserId) {
        if (keyword == null || keyword.trim().length() < 2) return new ArrayList<>();
        return messageRepository
                .searchGlobal(keyword.trim())
                .stream()
                .map(m -> toDto(m, currentUserId))
                .toList();
    }

    // ══════════════════════════════════════════════════════
    // UPLOAD FICHIER
    // ══════════════════════════════════════════════════════

    public FileUploadResponse uploadFile(MultipartFile file, String chatRoomId,
                                         String senderId, String name,
                                         String profile, String typeHint) throws Exception {
        fileStorage.validate(file);
        String mime   = file.getContentType();
        String type   = (typeHint != null && !typeHint.isBlank()) ? typeHint : fileStorage.detectType(mime);
        String url    = fileStorage.store(file, type);
        String size   = fileStorage.formatSize(file.getSize());
        String fname  = file.getOriginalFilename();
        String senderName = resolveSenderName(senderId, name);
        String time   = TIME_FMT.format(Instant.now());

        Message msg = Message.builder()
                .chatRoomId(chatRoomId).senderId(senderId).name(senderName)
                .profile(profile != null ? profile : "").message(fname)
                // ✅ FIX : align toujours "left" en base
                .align("left")
                .time(time).type(type).fileUrl(url)
                .fileName(fname).fileSize(size).fileMimeType(mime)
                .deleted(false).createdAt(Instant.now()).build();

        Message saved = messageRepository.save(msg);
        ChatMessageResponse dto = toDto(saved, senderId);
        messaging.convertAndSend("/topic/room/" + chatRoomId, dto);
        updateRoomLastMessage(chatRoomId, "📎 " + fname, senderName);

        // 🔔 Notifier les autres membres du room
        getRoomMembersExcept(chatRoomId, senderId).forEach(memberId ->
                notificationService.notifyFile(memberId, senderId, senderName,
                        resolveAvatarById(senderId), fname, chatRoomId, saved.getId()));

        return FileUploadResponse.builder().id(saved.getId()).url(url)
                .fileName(fname).fileSize(size).fileMimeType(mime).type(type).build();
    }

    // ══════════════════════════════════════════════════════
    // LOCALISATION
    // ══════════════════════════════════════════════════════

    public ChatMessageResponse sendLocation(LocationRequest req) {
        String senderName = resolveSenderName(req.getSenderId(), req.getName());
        String time       = TIME_FMT.format(Instant.now());
        String mapsUrl    = "https://www.google.com/maps?q=" + req.getLatitude() + "," + req.getLongitude();
        String mapThumb   = "https://staticmap.openstreetmap.de/staticmap.php?center="
                + req.getLatitude() + "," + req.getLongitude()
                + "&zoom=15&size=300x150&markers=" + req.getLatitude() + "," + req.getLongitude() + ",red";
        String msgText    = String.format("📍 Ma position (%.4f, %.4f)", req.getLatitude(), req.getLongitude());

        Message msg = Message.builder()
                .chatRoomId(req.getChatRoomId()).senderId(req.getSenderId()).name(senderName)
                .profile(req.getProfile() != null ? req.getProfile() : "").message(msgText)
                // ✅ FIX : align toujours "left" en base
                .align("left")
                .time(time).type("location")
                .latitude(req.getLatitude()).longitude(req.getLongitude()).locationUrl(mapsUrl)
                .deleted(false).createdAt(Instant.now()).build();

        Message saved = messageRepository.save(msg);
        ChatMessageResponse dto = toDto(saved, req.getSenderId());
        dto.setMapThumb(mapThumb);
        messaging.convertAndSend("/topic/room/" + req.getChatRoomId(), dto);
        updateRoomLastMessage(req.getChatRoomId(), "📍 Localisation", senderName);

        // 🔔 Notifier les autres membres du room
        getRoomMembersExcept(req.getChatRoomId(), req.getSenderId()).forEach(memberId ->
                notificationService.notifyLocation(memberId, req.getSenderId(), senderName,
                        resolveAvatarById(req.getSenderId()), req.getChatRoomId(), saved.getId()));

        return dto;
    }

    // ══════════════════════════════════════════════════════
    // RÉACTIONS
    // ══════════════════════════════════════════════════════

    public ChatMessageResponse addReaction(String messageId, ReactionRequest req) {
        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message introuvable : " + messageId));

        List<Map<String, Object>> reactions = msg.getReactions();
        if (reactions == null) reactions = new ArrayList<>();

        String emoji  = req.getEmoji();
        String userId = req.getUserId();

        Optional<Map<String, Object>> existingOpt = reactions.stream()
                .filter(r -> emoji.equals(r.get("emoji"))).findFirst();

        if (existingOpt.isPresent()) {
            Map<String, Object> existing = existingOpt.get();
            @SuppressWarnings("unchecked")
            List<String> userIds = (List<String>) existing.getOrDefault("userIds", new ArrayList<>());
            if (userIds.contains(userId)) {
                userIds.remove(userId);
                existing.put("count", userIds.size());
                if (userIds.isEmpty()) reactions.remove(existing);
            } else {
                userIds.add(userId);
                existing.put("count", userIds.size());
            }
        } else {
            Map<String, Object> newReaction = new HashMap<>();
            newReaction.put("emoji", emoji);
            newReaction.put("count", 1);
            newReaction.put("userIds", new ArrayList<>(List.of(userId)));
            reactions.add(newReaction);
        }

        msg.setReactions(reactions);
        Message saved = messageRepository.save(msg);
        ChatMessageResponse dto = toDto(saved, userId);
        messaging.convertAndSend("/topic/room/" + saved.getChatRoomId(), dto);

        // 🔔 Notifier le propriétaire du message si c'est pas lui qui réagit
        if (!saved.getSenderId().equals(userId)) {
            notificationService.notifyReaction(saved.getSenderId(), userId,
                    resolveNameById(userId), resolveAvatarById(userId),
                    emoji, saved.getChatRoomId(), saved.getId());
        }

        return dto;
    }

    // ══════════════════════════════════════════════════════
    // GET MESSAGES
    // ══════════════════════════════════════════════════════

    public List<Message> getByRoom(String chatRoomId) {
        return messageRepository.findByChatRoomIdAndDeletedFalseOrderByCreatedAtAsc(chatRoomId);
    }

    public List<ChatMessageResponse> getByRoomDto(String chatRoomId, String currentUserId) {
        markAllAsRead(chatRoomId, currentUserId);
        return getByRoom(chatRoomId).stream()
                .map(m -> toDto(m, currentUserId))
                .toList();
    }

    // ══════════════════════════════════════════════════════
    // DELETE
    // ══════════════════════════════════════════════════════

    public void delete(String messageId) {
        messageRepository.findById(messageId).ifPresent(msg -> {
            msg.setDeleted(true);
            messageRepository.save(msg);
            messaging.convertAndSend("/topic/room/" + msg.getChatRoomId(),
                    Map.of("event", "message_deleted", "messageId", messageId));
        });
    }

    // ══════════════════════════════════════════════════════
    // MAPPING Entity → DTO
    // ✅ FIX : align N'EST PAS retourné depuis la base
    //          le frontend le recalcule toujours depuis senderId
    // ══════════════════════════════════════════════════════

    public ChatMessageResponse toDto(Message m, String currentUserId) {
        ChatMessageResponse dto = new ChatMessageResponse();
        dto.setId(m.getId());
        dto.setChatRoomId(m.getChatRoomId());
        dto.setSenderId(m.getSenderId());
        dto.setName(m.getName());
        dto.setProfile(m.getProfile());
        dto.setMessage(m.getMessage());

        // ✅ FIX PRINCIPAL : ne jamais retourner align depuis la base
        // Le frontend calcule : senderId === currentUserId ? 'right' : 'left'
        // On met null pour forcer le frontend à recalculer
        dto.setAlign(null);

        dto.setTime(m.getTime());
        dto.setReplayName(m.getReplayName());
        dto.setReplaymsg(m.getReplaymsg());
        dto.setReplyToId(m.getReplyToId());
        dto.setImage(m.getImage());
        dto.setType(m.getType() != null ? m.getType() : "text");
        dto.setFileUrl(m.getFileUrl());
        dto.setFileName(m.getFileName());
        dto.setFileSize(m.getFileSize());
        dto.setFileMimeType(m.getFileMimeType());
        dto.setLatitude(m.getLatitude());
        dto.setLongitude(m.getLongitude());
        dto.setLocationUrl(m.getLocationUrl());

        if ("location".equals(m.getType()) && m.getLatitude() != null) {
            dto.setMapThumb("https://staticmap.openstreetmap.de/staticmap.php?center="
                    + m.getLatitude() + "," + m.getLongitude()
                    + "&zoom=15&size=300x150&markers="
                    + m.getLatitude() + "," + m.getLongitude() + ",red");
        }

        dto.setReactions(m.getReactions() != null ? m.getReactions() : new ArrayList<>());
        dto.setCreatedAt(m.getCreatedAt());

        // Statut de lecture
        Set<String> readBy = m.getReadBy() != null ? m.getReadBy() : new HashSet<>();
        dto.setReadBy(readBy);
        dto.setRead(readBy.stream().anyMatch(id -> !id.equals(m.getSenderId())));

        // Épinglé
        dto.setPinned(m.isPinned());
        dto.setPinnedBy(m.getPinnedBy());
        dto.setPinnedAt(m.getPinnedAt());

        // Mentions
        dto.setMentionedUserIds(m.getMentionedUserIds() != null ? m.getMentionedUserIds() : new ArrayList<>());

        return dto;
    }

    public ChatMessageResponse toDto(Message m) {
        return toDto(m, null);
    }

    // ══════════════════════════════════════════════════════
    // HELPERS PRIVÉS
    // ══════════════════════════════════════════════════════

    private String resolveSenderName(String senderId, String fallback) {
        if (senderId == null || senderId.isBlank())
            return fallback != null ? fallback : "Inconnu";
        return chatUserRepository.findByUserId(senderId)
                .map(ChatUser::getName)
                .filter(n -> n != null && !n.isBlank() && !n.equals("Utilisateur Inconnu"))
                .orElse(fallback != null ? fallback : "User-" + senderId);
    }

    private void enrichReply(Message msg, String replyToId) {
        messageRepository.findById(replyToId).ifPresent(ref -> {
            msg.setReplayName(ref.getName());
            msg.setReplaymsg(ref.getMessage());
        });
    }

    private void updateRoomLastMessage(String chatRoomId, String text, String senderName) {
        chatRoomRepository.findById(chatRoomId).ifPresent(room -> {
            room.setLastMessage(text);
            room.setLastSenderName(senderName);
            room.setLastMessageAt(Instant.now());
            chatRoomRepository.save(room);
        });
    }
}