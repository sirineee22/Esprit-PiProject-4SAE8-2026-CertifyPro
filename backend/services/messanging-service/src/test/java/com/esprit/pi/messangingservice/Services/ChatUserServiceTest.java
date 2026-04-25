package com.esprit.pi.messangingservice.Services;

import com.esprit.pi.messangingservice.DTO.ConnectRequest;
import com.esprit.pi.messangingservice.entities.ChatUser;
import com.esprit.pi.messangingservice.repositories.ChatUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatUserServiceTest {

    @Mock
    private ChatUserRepository userRepository;

    @InjectMocks
    private ChatUserService chatUserService;

    private ChatUser existingUser;

    @BeforeEach
    void setUp() {
        existingUser = ChatUser.builder()
                .id("mongo-id-1")
                .userId("user-1")
                .name("Alice")
                .email("alice@test.com")
                .status("offline")
                .connected(false)
                .build();
    }

    // ── connect ───────────────────────────────────────────────────────────────

    @Test
    void connect_existingUser_updatesStatusToOnline() {
        ConnectRequest req = new ConnectRequest();
        req.setUserId("user-1");
        req.setName("Alice");
        req.setEmail("alice@test.com");

        when(userRepository.findByUserId("user-1")).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(ChatUser.class))).thenAnswer(inv -> inv.getArgument(0));

        ChatUser result = chatUserService.connect(req);

        assertEquals("online", result.getStatus());
        assertTrue(result.isConnected());
        assertNotNull(result.getLastSeen());
        verify(userRepository).save(existingUser);
    }

    @Test
    void connect_newUser_createsAndSaves() {
        ConnectRequest req = new ConnectRequest();
        req.setUserId("user-new");
        req.setName("Bob");
        req.setEmail("bob@test.com");

        when(userRepository.findByUserId("user-new")).thenReturn(Optional.empty());
        when(userRepository.save(any(ChatUser.class))).thenAnswer(inv -> inv.getArgument(0));

        ChatUser result = chatUserService.connect(req);

        assertEquals("user-new", result.getUserId());
        assertEquals("Bob", result.getName());
        assertEquals("online", result.getStatus());
        verify(userRepository).save(any(ChatUser.class));
    }

    @Test
    void connect_withNullName_fallsBackToEmailPrefix() {
        ConnectRequest req = new ConnectRequest();
        req.setUserId("user-2");
        req.setName(null);
        req.setEmail("charlie@test.com");

        when(userRepository.findByUserId("user-2")).thenReturn(Optional.empty());
        when(userRepository.save(any(ChatUser.class))).thenAnswer(inv -> inv.getArgument(0));

        ChatUser result = chatUserService.connect(req);

        assertEquals("charlie", result.getName());
    }

    @Test
    void connect_withNullNameAndNullEmail_fallsBackToUserId() {
        ConnectRequest req = new ConnectRequest();
        req.setUserId("user-3");
        req.setName(null);
        req.setEmail(null);

        when(userRepository.findByUserId("user-3")).thenReturn(Optional.empty());
        when(userRepository.save(any(ChatUser.class))).thenAnswer(inv -> inv.getArgument(0));

        ChatUser result = chatUserService.connect(req);

        assertEquals("User-user-3", result.getName());
    }

    @Test
    void connect_withNullUserId_throwsIllegalArgument() {
        ConnectRequest req = new ConnectRequest();
        req.setUserId(null);

        assertThrows(IllegalArgumentException.class, () -> chatUserService.connect(req));
        verify(userRepository, never()).save(any());
    }

    @Test
    void connect_withBlankUserId_throwsIllegalArgument() {
        ConnectRequest req = new ConnectRequest();
        req.setUserId("   ");

        assertThrows(IllegalArgumentException.class, () -> chatUserService.connect(req));
    }

    // ── disconnect ────────────────────────────────────────────────────────────

    @Test
    void disconnect_existingUser_setsOffline() {
        existingUser.setStatus("online");
        existingUser.setConnected(true);

        when(userRepository.findByUserId("user-1")).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(ChatUser.class))).thenAnswer(inv -> inv.getArgument(0));

        ChatUser result = chatUserService.disconnect("user-1");

        assertEquals("offline", result.getStatus());
        assertFalse(result.isConnected());
        assertNotNull(result.getLastSeen());
    }

    @Test
    void disconnect_unknownUser_throwsRuntimeException() {
        when(userRepository.findByUserId("unknown")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> chatUserService.disconnect("unknown"));
    }

    // ── findByUserId ──────────────────────────────────────────────────────────

    @Test
    void findByUserId_existingUser_returnsPresent() {
        when(userRepository.findByUserId("user-1")).thenReturn(Optional.of(existingUser));

        Optional<ChatUser> result = chatUserService.findByUserId("user-1");

        assertTrue(result.isPresent());
        assertEquals("Alice", result.get().getName());
    }

    @Test
    void findByUserId_nullId_returnsEmpty() {
        Optional<ChatUser> result = chatUserService.findByUserId(null);

        assertTrue(result.isEmpty());
        verify(userRepository, never()).findByUserId(any());
    }

    @Test
    void findByUserId_blankId_returnsEmpty() {
        Optional<ChatUser> result = chatUserService.findByUserId("  ");

        assertTrue(result.isEmpty());
    }

    // ── getAllUsers ───────────────────────────────────────────────────────────

    @Test
    void getAllUsers_returnsListFromRepository() {
        when(userRepository.findAllByOrderByNameAsc()).thenReturn(List.of(existingUser));

        List<ChatUser> result = chatUserService.getAllUsers();

        assertEquals(1, result.size());
        assertEquals("Alice", result.get(0).getName());
    }

    // ── getOnlineUsers ────────────────────────────────────────────────────────

    @Test
    void getOnlineUsers_returnsOnlyConnectedUsers() {
        existingUser.setConnected(true);
        when(userRepository.findByConnectedTrue()).thenReturn(List.of(existingUser));

        List<ChatUser> result = chatUserService.getOnlineUsers();

        assertEquals(1, result.size());
        assertTrue(result.get(0).isConnected());
    }

    // ── searchUsers ───────────────────────────────────────────────────────────

    @Test
    void searchUsers_matchingName_returnsResults() {
        when(userRepository.findAll()).thenReturn(List.of(existingUser));

        List<Map<String, Object>> result = chatUserService.searchUsers("ali", "other-user");

        assertEquals(1, result.size());
        assertEquals("user-1", result.get(0).get("id"));
        assertEquals("Alice",  result.get(0).get("name"));
    }

    @Test
    void searchUsers_excludesCurrentUser() {
        when(userRepository.findAll()).thenReturn(List.of(existingUser));

        List<Map<String, Object>> result = chatUserService.searchUsers("ali", "user-1");

        assertTrue(result.isEmpty());
    }

    @Test
    void searchUsers_blankQuery_returnsEmpty() {
        List<Map<String, Object>> result = chatUserService.searchUsers("  ", "other");

        assertTrue(result.isEmpty());
        verify(userRepository, never()).findAll();
    }

    @Test
    void searchUsers_noMatch_returnsEmpty() {
        when(userRepository.findAll()).thenReturn(List.of(existingUser));

        List<Map<String, Object>> result = chatUserService.searchUsers("xyz", "other");

        assertTrue(result.isEmpty());
    }
}
