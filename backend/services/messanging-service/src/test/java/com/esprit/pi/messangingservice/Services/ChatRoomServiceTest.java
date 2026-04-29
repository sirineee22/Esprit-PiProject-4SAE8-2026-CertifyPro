package com.esprit.pi.messangingservice.Services;

import com.esprit.pi.messangingservice.entities.ChatRoom;
import com.esprit.pi.messangingservice.repositories.ChatRoomRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatRoomServiceTest {

    @Mock
    private ChatRoomRepository roomRepository;

    @InjectMocks
    private ChatRoomService chatRoomService;

    private ChatRoom chatRoom;

    @BeforeEach
    void setUp() {
        chatRoom = new ChatRoom();
        chatRoom.setId("room1");
        chatRoom.setName("Test Group");
        chatRoom.setType(ChatRoom.RoomType.GROUP);
        chatRoom.setMemberIds(new HashSet<>(Arrays.asList("user1", "user2")));
    }

    // ============================================
    // findById Tests
    // ============================================

    @Test
    void shouldFindRoomByIdSuccessfully() {
        when(roomRepository.findById("room1")).thenReturn(Optional.of(chatRoom));

        Optional<ChatRoom> result = chatRoomService.findById("room1");

        assertTrue(result.isPresent());
        assertEquals("room1", result.get().getId());
    }

    @Test
    void shouldReturnEmptyWhenRoomNotFound() {
        when(roomRepository.findById("room99")).thenReturn(Optional.empty());

        Optional<ChatRoom> result = chatRoomService.findById("room99");

        assertFalse(result.isPresent());
    }

    // ============================================
    // save Tests
    // ============================================

    @Test
    void shouldSaveRoomSuccessfully() {
        when(roomRepository.save(any(ChatRoom.class))).thenReturn(chatRoom);

        ChatRoom result = chatRoomService.save(new ChatRoom());

        assertNotNull(result);
        assertEquals("room1", result.getId());
    }

    // ============================================
    // getRoomsForUser Tests
    // ============================================

    @Test
    void shouldGetRoomsForUserSuccessfully() {
        when(roomRepository.findByMemberIdsContaining("user1"))
                .thenReturn(Collections.singletonList(chatRoom));

        List<ChatRoom> result = chatRoomService.getRoomsForUser("user1");

        assertEquals(1, result.size());
        assertEquals("room1", result.get(0).getId());
    }

    @Test
    void shouldReturnEmptyListWhenUserHasNoRooms() {
        when(roomRepository.findByMemberIdsContaining("user99"))
                .thenReturn(Collections.emptyList());

        List<ChatRoom> result = chatRoomService.getRoomsForUser("user99");

        assertTrue(result.isEmpty());
    }

    // ============================================
    // getOrCreateDirect Tests
    // ============================================

    @Test
    void shouldReturnExistingDirectRoom() {
        when(roomRepository.findDirectRoomBetweenUsers(ChatRoom.RoomType.DIRECT, "u1", "u2"))
                .thenReturn(Optional.of(chatRoom));

        ChatRoom result = chatRoomService.getOrCreateDirect("u1", "u2");

        assertNotNull(result);
        assertEquals("room1", result.getId());
        verify(roomRepository, never()).save(any(ChatRoom.class));
    }

    @Test
    void shouldCreateNewDirectRoomWhenNotExists() {
        ChatRoom newRoom = new ChatRoom();
        newRoom.setId("newRoom");
        newRoom.setType(ChatRoom.RoomType.DIRECT);

        when(roomRepository.findDirectRoomBetweenUsers(ChatRoom.RoomType.DIRECT, "u1", "u2"))
                .thenReturn(Optional.empty());
        when(roomRepository.save(any(ChatRoom.class))).thenReturn(newRoom);

        ChatRoom result = chatRoomService.getOrCreateDirect("u1", "u2");

        assertNotNull(result);
        assertEquals("newRoom", result.getId());
        verify(roomRepository, times(1)).save(any(ChatRoom.class));
    }

    // ============================================
    // createDirectRoom & createGroup Tests
    // ============================================

    @Test
    void shouldCreateDirectRoom() {
        when(roomRepository.save(any(ChatRoom.class))).thenReturn(chatRoom);

        ChatRoom result = chatRoomService.createDirectRoom("u1", "u2");

        assertNotNull(result);
        verify(roomRepository, times(1)).save(any(ChatRoom.class));
    }

    @Test
    void shouldCreateGroupRoom() {
        when(roomRepository.save(any(ChatRoom.class))).thenReturn(chatRoom);

        ChatRoom result = chatRoomService.createGroup("Dev Team", Arrays.asList("u1", "u2", "u3"));

        assertNotNull(result);
        assertEquals("Test Group", result.getName());
        verify(roomRepository, times(1)).save(any(ChatRoom.class));
    }

    // ============================================
    // updateLastMessage Tests
    // ============================================

    @Test
    void shouldUpdateLastMessageSuccessfully() {
        when(roomRepository.findById("room1")).thenReturn(Optional.of(chatRoom));
        when(roomRepository.save(any(ChatRoom.class))).thenReturn(chatRoom);

        chatRoomService.updateLastMessage("room1", "Alice", "Hello World");

        assertEquals("Hello World", chatRoom.getLastMessage());
        assertEquals("Alice", chatRoom.getLastSenderName());
        verify(roomRepository, times(1)).save(chatRoom);
    }

    @Test
    void shouldNotUpdateMessageWhenRoomNotFound() {
        when(roomRepository.findById("room99")).thenReturn(Optional.empty());

        chatRoomService.updateLastMessage("room99", "Alice", "Hello");

        verify(roomRepository, never()).save(any(ChatRoom.class));
    }

    // ============================================
    // getAllGroups Tests
    // ============================================

    @Test
    void shouldGetAllGroupsSuccessfully() {
        when(roomRepository.findByType(ChatRoom.RoomType.GROUP))
                .thenReturn(Collections.singletonList(chatRoom));

        List<ChatRoom> result = chatRoomService.getAllGroups();

        assertEquals(1, result.size());
        assertEquals(ChatRoom.RoomType.GROUP, result.get(0).getType());
    }
}
