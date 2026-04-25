package com.esprit.pi.messangingservice.Services;

import com.esprit.pi.messangingservice.DTO.ChatMessageResponse;
import com.esprit.pi.messangingservice.DTO.MessageRequest;
import com.esprit.pi.messangingservice.DTO.ReactionRequest;
import com.esprit.pi.messangingservice.entities.ChatRoom;
import com.esprit.pi.messangingservice.entities.ChatUser;
import com.esprit.pi.messangingservice.entities.Message;
import com.esprit.pi.messangingservice.repositories.ChatRoomRepository;
import com.esprit.pi.messangingservice.repositories.ChatUserRepository;
import com.esprit.pi.messangingservice.repositories.MessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MessageServiceTest {

    @Mock
    private MessageRepository messageRepository;
    @Mock
    private ChatRoomRepository chatRoomRepository;
    @Mock
    private ChatUserRepository chatUserRepository;
    @Mock
    private SimpMessagingTemplate messaging;
    @Mock
    private FileStorageService fileStorage;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private MessageService messageService;

    private MessageRequest messageRequest;
    private Message savedMessage;
    private ChatUser sender;
    private ChatRoom chatRoom;

    @BeforeEach
    void setUp() {
        messageRequest = new MessageRequest();
        messageRequest.setChatRoomId("room1");
        messageRequest.setSenderId("user1");
        messageRequest.setMessage("Hello world");
        messageRequest.setName("Alice");
        messageRequest.setType("text");

        sender = new ChatUser();
        sender.setId("u1");
        sender.setUserId("user1");
        sender.setName("Alice");

        Set<String> members = new HashSet<>(Arrays.asList("user1", "user2"));

        chatRoom = new ChatRoom();
        chatRoom.setId("room1");
        chatRoom.setMemberIds(members);

        savedMessage = Message.builder()
                .id("msg1")
                .chatRoomId("room1")
                .senderId("user1")
                .name("Alice")
                .message("Hello world")
                .readBy(new HashSet<>())
                .reactions(new ArrayList<>())
                .build();
    }

    // ============================================
    // save message Tests
    // ============================================

    @Test
    void shouldSaveMessageSuccessfully() {
        when(chatUserRepository.findByUserId("user1")).thenReturn(Optional.of(sender));
        when(messageRepository.save(any(Message.class))).thenReturn(savedMessage);
        when(chatRoomRepository.findById("room1")).thenReturn(Optional.of(chatRoom));

        Message result = messageService.save(messageRequest);

        assertNotNull(result);
        assertEquals("msg1", result.getId());
        assertEquals("Hello world", result.getMessage());

        verify(messageRepository, times(1)).save(any(Message.class));
        verify(chatRoomRepository, times(1)).save(any(ChatRoom.class)); // Updates last message
        verify(notificationService, times(1)).notifyNewMessage(
                eq("user2"), eq("user1"), eq("Alice"), anyString(), eq("Hello world"), eq("room1"), eq("msg1")
        );
    }

    @Test
    void shouldThrowExceptionWhenChatRoomIdIsMissing() {
        messageRequest.setChatRoomId(null);
        
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> messageService.save(messageRequest));
        
        assertTrue(exception.getMessage().contains("chatRoomId et senderId sont requis"));
        verify(messageRepository, never()).save(any());
    }

    @Test
    void shouldSaveMessageWhenMentionsExist() {
        messageRequest.setMessage("Hello @Bob how are you?");
        
        ChatUser bob = new ChatUser();
        bob.setUserId("user2");
        bob.setName("Bob");

        when(chatUserRepository.findByUserId("user1")).thenReturn(Optional.of(sender));
        when(chatUserRepository.findByNameIgnoreCase("Bob")).thenReturn(Optional.of(bob));
        when(messageRepository.save(any(Message.class))).thenReturn(savedMessage);
        when(chatRoomRepository.findById("room1")).thenReturn(Optional.of(chatRoom));

        messageService.save(messageRequest);

        verify(notificationService, times(1)).send(
                eq("user2"), eq("user1"), eq("Alice"), anyString(), eq("mention"), anyString(), anyString(), eq("room1"), eq("msg1")
        );
    }

    // ============================================
    // Read Status Tests
    // ============================================

    @Test
    void shouldMarkAsReadSuccessfully() {
        savedMessage.setReadBy(new HashSet<>());
        when(messageRepository.findById("msg1")).thenReturn(Optional.of(savedMessage));

        messageService.markAsRead("msg1", "user2");

        assertTrue(savedMessage.getReadBy().contains("user2"));
        verify(messageRepository, times(1)).save(savedMessage);
        verify(messaging, times(1)).convertAndSend(eq("/topic/room/room1"), any(Object.class));
    }

    @Test
    void shouldMarkAllAsReadSuccessfully() {
        List<Message> messages = Collections.singletonList(savedMessage);
        when(messageRepository.findByChatRoomIdAndDeletedFalseOrderByCreatedAtAsc("room1"))
                .thenReturn(messages);

        messageService.markAllAsRead("room1", "user2");

        assertTrue(savedMessage.getReadBy().contains("user2"));
        verify(messageRepository, times(1)).saveAll(messages);
        verify(messaging, times(1)).convertAndSend(eq("/topic/room/room1"), any(Object.class));
    }

    // ============================================
    // Pin Message Tests
    // ============================================

    @Test
    void shouldTogglePinMessage() {
        savedMessage.setPinned(false);
        when(messageRepository.findById("msg1")).thenReturn(Optional.of(savedMessage));
        when(messageRepository.save(any(Message.class))).thenReturn(savedMessage);

        ChatMessageResponse response = messageService.togglePin("msg1", "user2");

        assertTrue(response.isPinned());
        verify(messageRepository, times(1)).save(savedMessage);
        verify(messaging, times(1)).convertAndSend(eq("/topic/room/room1"), any(Object.class));
    }

    @Test
    void shouldThrowExceptionWhenTogglingPinNonExistentMessage() {
        when(messageRepository.findById("msg99")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> messageService.togglePin("msg99", "user1"));
    }

    @Test
    void shouldGetPinnedMessages() {
        savedMessage.setPinned(true);
        when(messageRepository.findByChatRoomIdAndPinnedTrueAndDeletedFalse("room1"))
                .thenReturn(Collections.singletonList(savedMessage));

        List<ChatMessageResponse> result = messageService.getPinnedMessages("room1", "user2");

        assertEquals(1, result.size());
        assertTrue(result.get(0).isPinned());
    }

    // ============================================
    // Reaction Tests
    // ============================================

    @Test
    void shouldAddReactionSuccessfully() {
        ReactionRequest reactionRequest = new ReactionRequest();
        reactionRequest.setEmoji("👍");
        reactionRequest.setUserId("user2");

        when(messageRepository.findById("msg1")).thenReturn(Optional.of(savedMessage));
        when(messageRepository.save(any(Message.class))).thenReturn(savedMessage);

        ChatMessageResponse response = messageService.addReaction("msg1", reactionRequest);

        assertNotNull(response);
        verify(messageRepository, times(1)).save(savedMessage);
    }

    @Test
    void shouldRemoveReactionIfAlreadyExists() {
        ReactionRequest reactionRequest = new ReactionRequest();
        reactionRequest.setEmoji("👍");
        reactionRequest.setUserId("user2");

        Map<String, Object> reactionMap = new HashMap<>();
        reactionMap.put("emoji", "👍");
        reactionMap.put("count", 1);
        List<String> users = new ArrayList<>(Collections.singletonList("user2"));
        reactionMap.put("userIds", users);
        
        savedMessage.getReactions().add(reactionMap);

        when(messageRepository.findById("msg1")).thenReturn(Optional.of(savedMessage));
        when(messageRepository.save(any(Message.class))).thenReturn(savedMessage);

        messageService.addReaction("msg1", reactionRequest);

        verify(messageRepository, times(1)).save(savedMessage);
        assertTrue(savedMessage.getReactions().isEmpty());
    }

    // ============================================
    // Delete Tests
    // ============================================

    @Test
    void shouldDeleteMessageSuccessfully() {
        when(messageRepository.findById("msg1")).thenReturn(Optional.of(savedMessage));

        messageService.delete("msg1");

        assertTrue(savedMessage.isDeleted());
        verify(messageRepository, times(1)).save(savedMessage);
        verify(messaging, times(1)).convertAndSend(eq("/topic/room/room1"), any(Map.class));
    }

    // ============================================
    // Get & Search Tests
    // ============================================

    @Test
    void shouldGetMessagesByRoomDto() {
        when(messageRepository.findByChatRoomIdAndDeletedFalseOrderByCreatedAtAsc("room1"))
                .thenReturn(Collections.singletonList(savedMessage));

        List<ChatMessageResponse> result = messageService.getByRoomDto("room1", "user2");

        assertEquals(1, result.size());
        assertEquals("msg1", result.get(0).getId());
    }

    @Test
    void shouldSearchMessagesSuccessfully() {
        when(messageRepository.searchInRoom("room1", "Hello"))
                .thenReturn(Collections.singletonList(savedMessage));

        List<ChatMessageResponse> result = messageService.searchMessages("room1", "Hello", "user2");

        assertEquals(1, result.size());
        assertEquals("Hello world", result.get(0).getMessage());
    }

    @Test
    void shouldReturnEmptyWhenSearchKeywordTooShort() {
        List<ChatMessageResponse> result = messageService.searchMessages("room1", "H", "user2");
        assertTrue(result.isEmpty());
        verify(messageRepository, never()).searchInRoom(anyString(), anyString());
    }
}
