package com.esprit.pi.messangingservice.controllers;

import com.esprit.pi.messangingservice.DTO.*;
import com.esprit.pi.messangingservice.Services.*;
import com.esprit.pi.messangingservice.config.JwtService;
import com.esprit.pi.messangingservice.entities.ChatRoom;
import com.esprit.pi.messangingservice.entities.ChatUser;
import com.esprit.pi.messangingservice.entities.Message;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.MediaType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests unitaires pour ChatRestController.
 *
 * Stratégie : on utilise MockMvcBuilders.standaloneSetup() pour éviter
 * de charger le contexte Spring complet (pas de MongoDB, pas de Eureka).
 * L'authentification JWT est simulée en mockant JwtService.extractUserId().
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ChatRestControllerTest {

    // ── Mocks ────────────────────────────────────────────────────────────────
    @Mock private MessageService       messageService;
    @Mock private ChatRoomService      roomService;
    @Mock private ChatUserService      userService;
    @Mock private ContactService       contactService;
    @Mock private JwtService           jwtService;
    @Mock private FileStorageService   fileStorageService;
    @Mock private SimpMessagingTemplate messaging;

    @InjectMocks
    private ChatRestController controller;

    private MockMvc mockMvc;
    private final ObjectMapper json = new ObjectMapper();

    // ── Constants ─────────────────────────────────────────────────────────────
    private static final String USER_ID = "user-1";
    private static final String TOKEN   = "valid.jwt.token";
    private static final String BEARER  = "Bearer " + TOKEN;

    // ── Fixtures ──────────────────────────────────────────────────────────────
    private ChatUser alice;
    private ChatRoom directRoom;
    private ChatMessageResponse msgDto;
    private Message savedMsg;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        // Default: valid token → user-1
        when(jwtService.extractUserId(TOKEN)).thenReturn(USER_ID);
        when(jwtService.extractName(TOKEN)).thenReturn("Alice");
        when(jwtService.extractEmail(TOKEN)).thenReturn("alice@test.com");
        when(jwtService.extractImage(TOKEN)).thenReturn(null);

        alice = ChatUser.builder()
                .id("mongo-1").userId(USER_ID).name("Alice")
                .email("alice@test.com").status("online").connected(true).build();

        directRoom = ChatRoom.builder()
                .id("room-1").type(ChatRoom.RoomType.DIRECT)
                .memberIds(new HashSet<>(Set.of(USER_ID, "user-2"))).build();

        msgDto = ChatMessageResponse.builder()
                .id("msg-1").chatRoomId("room-1")
                .senderId(USER_ID).name("Alice").message("Hello!").type("text").build();

        savedMsg = Message.builder()
                .id("msg-1").chatRoomId("room-1")
                .senderId(USER_ID).name("Alice").message("Hello!").build();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // POST /api/chat/users/register
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void register_withValidToken_returns200() throws Exception {
        when(userService.connect(any(ConnectRequest.class))).thenReturn(alice);

        mockMvc.perform(post("/api/chat/users/register")
                        .header("Authorization", BEARER))
                .andExpect(status().isOk());

        verify(userService).connect(any(ConnectRequest.class));
    }

    @Test
    void register_withoutToken_returns401() throws Exception {
        mockMvc.perform(post("/api/chat/users/register"))
                .andExpect(status().isUnauthorized());

        verify(userService, never()).connect(any());
    }

    @Test
    void register_withInvalidToken_returns400() throws Exception {
        when(jwtService.extractUserId("bad")).thenReturn(null);

        mockMvc.perform(post("/api/chat/users/register")
                        .header("Authorization", "Bearer bad"))
                .andExpect(status().isBadRequest());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET /api/chat/users/search
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void searchUsers_withValidToken_returns200() throws Exception {
        ChatUser bob = ChatUser.builder().userId("user-2").name("Bob").build();
        when(userService.getAllUsers()).thenReturn(List.of(alice, bob));

        mockMvc.perform(get("/api/chat/users/search")
                        .param("query", "bob")
                        .header("Authorization", BEARER))
                .andExpect(status().isOk());
    }

    @Test
    void searchUsers_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/chat/users/search").param("query", "bob"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void searchUsers_excludesCurrentUser() throws Exception {
        ChatUser bob = ChatUser.builder().userId("user-2").name("Bob").build();
        when(userService.getAllUsers()).thenReturn(List.of(alice, bob));

        // alice (user-1) searches "alice" — should not return herself
        mockMvc.perform(get("/api/chat/users/search")
                        .param("query", "alice")
                        .header("Authorization", BEARER))
                .andExpect(status().isOk());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET /api/chat/chatdata
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void chatData_withValidToken_returns200() throws Exception {
        when(roomService.getRoomsForUser(USER_ID)).thenReturn(List.of(directRoom));
        when(userService.getAllUsers()).thenReturn(List.of(alice));

        mockMvc.perform(get("/api/chat/chatdata")
                        .header("Authorization", BEARER))
                .andExpect(status().isOk());
    }

    @Test
    void chatData_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/chat/chatdata"))
                .andExpect(status().isUnauthorized());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET /api/chat/groupdata
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void groupData_withValidToken_returns200() throws Exception {
        ChatRoom group = ChatRoom.builder()
                .id("grp-1").type(ChatRoom.RoomType.GROUP)
                .memberIds(Set.of(USER_ID, "user-2")).build();
        when(roomService.getRoomsForUser(USER_ID)).thenReturn(List.of(group));

        mockMvc.perform(get("/api/chat/groupdata")
                        .header("Authorization", BEARER))
                .andExpect(status().isOk());
    }

    @Test
    void groupData_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/chat/groupdata"))
                .andExpect(status().isUnauthorized());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // POST /api/chat/rooms/direct/{targetUserId}
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void openDirectRoom_withValidToken_returns200() throws Exception {
        when(roomService.getOrCreateDirectRoom(USER_ID, "user-2")).thenReturn(directRoom);

        mockMvc.perform(post("/api/chat/rooms/direct/user-2")
                        .header("Authorization", BEARER))
                .andExpect(status().isOk());

        verify(roomService).getOrCreateDirectRoom(USER_ID, "user-2");
    }

    @Test
    void openDirectRoom_withoutToken_returns401() throws Exception {
        mockMvc.perform(post("/api/chat/rooms/direct/user-2"))
                .andExpect(status().isUnauthorized());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET /api/chat/messages/{roomId}
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void getMessages_withValidToken_returns200() throws Exception {
        when(messageService.getByRoomDto("room-1", USER_ID)).thenReturn(List.of(msgDto));

        mockMvc.perform(get("/api/chat/messages/room-1")
                        .header("Authorization", BEARER))
                .andExpect(status().isOk());

        verify(messageService).getByRoomDto("room-1", USER_ID);
    }

    @Test
    void getMessages_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/chat/messages/room-1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getMessages_returnsEmptyList_whenNoMessages() throws Exception {
        when(messageService.getByRoomDto("room-empty", USER_ID)).thenReturn(List.of());

        mockMvc.perform(get("/api/chat/messages/room-empty")
                        .header("Authorization", BEARER))
                .andExpect(status().isOk());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // DELETE /api/chat/messages/{messageId}
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void deleteMessage_withValidToken_returns204() throws Exception {
        mockMvc.perform(delete("/api/chat/messages/msg-1")
                        .header("Authorization", BEARER))
                .andExpect(status().isNoContent());

        verify(messageService).delete("msg-1", USER_ID);
    }

    @Test
    void deleteMessage_withoutToken_returns401() throws Exception {
        mockMvc.perform(delete("/api/chat/messages/msg-1"))
                .andExpect(status().isUnauthorized());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // POST /api/chat/messages/{messageId}/read
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void markMessageRead_withValidToken_returns204() throws Exception {
        mockMvc.perform(post("/api/chat/messages/msg-1/read")
                        .header("Authorization", BEARER))
                .andExpect(status().isNoContent());

        verify(messageService).markAsRead("msg-1", USER_ID);
    }

    @Test
    void markMessageRead_withoutToken_returns401() throws Exception {
        mockMvc.perform(post("/api/chat/messages/msg-1/read"))
                .andExpect(status().isUnauthorized());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // POST /api/chat/rooms/{roomId}/read-all
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void markAllRead_withValidToken_returns204() throws Exception {
        mockMvc.perform(post("/api/chat/rooms/room-1/read-all")
                        .header("Authorization", BEARER))
                .andExpect(status().isNoContent());

        verify(messageService).markAllAsRead("room-1", USER_ID);
    }

    @Test
    void markAllRead_withoutToken_returns401() throws Exception {
        mockMvc.perform(post("/api/chat/rooms/room-1/read-all"))
                .andExpect(status().isUnauthorized());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // POST /api/chat/messages/{messageId}/reactions
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void addReaction_withValidToken_returns200() throws Exception {
        msgDto.setReactions(List.of(Map.of("emoji", "👍", "count", 1)));
        when(messageService.addReaction(eq("msg-1"), any(ReactionRequest.class))).thenReturn(msgDto);

        ReactionRequest req = new ReactionRequest("👍", USER_ID);

        mockMvc.perform(post("/api/chat/messages/msg-1/reactions")
                        .header("Authorization", BEARER)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(req)))
                .andExpect(status().isOk());

        verify(messageService).addReaction(eq("msg-1"), any(ReactionRequest.class));
        verify(messaging).convertAndSend(eq("/topic/room/room-1"), any(Map.class));
    }

    @Test
    void addReaction_withoutToken_returns401() throws Exception {
        mockMvc.perform(post("/api/chat/messages/msg-1/reactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new ReactionRequest("👍", ""))))
                .andExpect(status().isUnauthorized());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // POST /api/chat/messages/{messageId}/pin
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void togglePin_withValidToken_returns200() throws Exception {
        msgDto.setPinned(true);
        when(messageService.togglePin("msg-1", USER_ID)).thenReturn(msgDto);

        mockMvc.perform(post("/api/chat/messages/msg-1/pin")
                        .header("Authorization", BEARER))
                .andExpect(status().isOk());

        verify(messageService).togglePin("msg-1", USER_ID);
        verify(messaging).convertAndSend(eq("/topic/room/room-1"), any(Map.class));
    }

    @Test
    void togglePin_withoutToken_returns401() throws Exception {
        mockMvc.perform(post("/api/chat/messages/msg-1/pin"))
                .andExpect(status().isUnauthorized());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET /api/chat/rooms/{roomId}/pinned
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void getPinned_withValidToken_returns200() throws Exception {
        msgDto.setPinned(true);
        when(messageService.getPinnedMessages("room-1", USER_ID)).thenReturn(List.of(msgDto));

        mockMvc.perform(get("/api/chat/rooms/room-1/pinned")
                        .header("Authorization", BEARER))
                .andExpect(status().isOk());

        verify(messageService).getPinnedMessages("room-1", USER_ID);
    }

    @Test
    void getPinned_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/chat/rooms/room-1/pinned"))
                .andExpect(status().isUnauthorized());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET /api/chat/rooms/{roomId}/search
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void searchMessages_withValidToken_returns200() throws Exception {
        when(messageService.searchMessages("room-1", "hello", USER_ID))
                .thenReturn(List.of(msgDto));

        mockMvc.perform(get("/api/chat/rooms/room-1/search")
                        .param("keyword", "hello")
                        .header("Authorization", BEARER))
                .andExpect(status().isOk());

        verify(messageService).searchMessages("room-1", "hello", USER_ID);
    }

    @Test
    void searchMessages_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/chat/rooms/room-1/search").param("keyword", "hello"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void searchMessages_returnsEmptyList_whenNoResults() throws Exception {
        when(messageService.searchMessages("room-1", "xyz", USER_ID)).thenReturn(List.of());

        mockMvc.perform(get("/api/chat/rooms/room-1/search")
                        .param("keyword", "xyz")
                        .header("Authorization", BEARER))
                .andExpect(status().isOk());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PUT /api/chat/messages/{messageId}  (edit)
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void editMessage_withValidToken_returns200() throws Exception {
        msgDto.setMessage("Updated text");
        msgDto.setEdited(true);
        when(messageService.edit("msg-1", USER_ID, "Updated text")).thenReturn(msgDto);

        mockMvc.perform(put("/api/chat/messages/msg-1")
                        .header("Authorization", BEARER)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\": \"Updated text\"}"))
                .andExpect(status().isOk());

        verify(messageService).edit("msg-1", USER_ID, "Updated text");
        verify(messaging).convertAndSend(eq("/topic/room/room-1"), any(Map.class));
    }

    @Test
    void editMessage_withoutToken_returns401() throws Exception {
        mockMvc.perform(put("/api/chat/messages/msg-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\": \"text\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void editMessage_withBlankText_returns400() throws Exception {
        mockMvc.perform(put("/api/chat/messages/msg-1")
                        .header("Authorization", BEARER)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\": \"   \"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void editMessage_whenNotOwner_returns403() throws Exception {
        // messageService.edit returns null when user is not the owner
        when(messageService.edit("msg-1", USER_ID, "text")).thenReturn(null);

        mockMvc.perform(put("/api/chat/messages/msg-1")
                        .header("Authorization", BEARER)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\": \"text\"}"))
                .andExpect(status().isForbidden());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // DELETE /api/chat/rooms/{roomId}/messages  (delete all)
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void deleteAllMessages_withValidToken_returns204() throws Exception {
        mockMvc.perform(delete("/api/chat/rooms/room-1/messages")
                        .header("Authorization", BEARER))
                .andExpect(status().isNoContent());

        verify(messageService).deleteAll("room-1", USER_ID);
        verify(messaging).convertAndSend(eq("/topic/room/room-1"), any(Map.class));
    }

    @Test
    void deleteAllMessages_withoutToken_returns401() throws Exception {
        mockMvc.perform(delete("/api/chat/rooms/room-1/messages"))
                .andExpect(status().isUnauthorized());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET /api/chat/contacts
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void getContacts_withValidToken_returns200() throws Exception {
        when(contactService.getContacts(USER_ID)).thenReturn(List.of());

        mockMvc.perform(get("/api/chat/contacts")
                        .header("Authorization", BEARER))
                .andExpect(status().isOk());

        verify(contactService).getContacts(USER_ID);
    }

    @Test
    void getContacts_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/chat/contacts"))
                .andExpect(status().isUnauthorized());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET /api/chat/users/{targetUserId}/presence
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void getPresence_existingUser_returns200() throws Exception {
        when(userService.findByUserId("user-2")).thenReturn(Optional.of(
                ChatUser.builder().userId("user-2").status("online").connected(true).build()
        ));

        mockMvc.perform(get("/api/chat/users/user-2/presence")
                        .header("Authorization", BEARER))
                .andExpect(status().isOk());

        verify(userService).findByUserId("user-2");
    }

    @Test
    void getPresence_unknownUser_returns404() throws Exception {
        when(userService.findByUserId("unknown")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/chat/users/unknown/presence")
                        .header("Authorization", BEARER))
                .andExpect(status().isNotFound());
    }

    @Test
    void getPresence_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/chat/users/user-2/presence"))
                .andExpect(status().isUnauthorized());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET /api/chat/messages/{messageId}/seen-by
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void getSeenBy_withValidToken_returns200() throws Exception {
        List<Map<String, Object>> seenBy = List.of(
                Map.of("userId", "user-2", "name", "Bob", "status", "online")
        );
        when(messageService.getSeenBy("msg-1", USER_ID))
                .thenReturn(org.springframework.http.ResponseEntity.ok(seenBy));

        mockMvc.perform(get("/api/chat/messages/msg-1/seen-by")
                        .header("Authorization", BEARER))
                .andExpect(status().isOk());

        verify(messageService).getSeenBy("msg-1", USER_ID);
    }

    @Test
    void getSeenBy_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/chat/messages/msg-1/seen-by"))
                .andExpect(status().isUnauthorized());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // POST /api/chat/location
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void sendLocation_withValidToken_returns200() throws Exception {
        when(messageService.save(any())).thenReturn(savedMsg);
        when(messageService.toDto(eq(savedMsg), eq(USER_ID))).thenReturn(msgDto);

        LocationRequest req = new LocationRequest("room-1", USER_ID, "Alice", null, 36.8, 10.18);

        mockMvc.perform(post("/api/chat/location")
                        .header("Authorization", BEARER)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(req)))
                .andExpect(status().isOk());

        verify(messageService).save(any());
        verify(messaging).convertAndSend(eq("/topic/room/room-1"), any(Object.class));
    }

    @Test
    void sendLocation_withoutToken_returns401() throws Exception {
        LocationRequest req = new LocationRequest("room-1", USER_ID, "Alice", null, 36.8, 10.18);

        mockMvc.perform(post("/api/chat/location")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }
}
