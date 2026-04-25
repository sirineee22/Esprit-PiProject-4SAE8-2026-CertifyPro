package com.esprit.pi.messangingservice.Services;

import com.esprit.pi.messangingservice.DTO.ContactModelResponse;
import com.esprit.pi.messangingservice.entities.ChatUser;
import com.esprit.pi.messangingservice.repositories.ChatUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContactServiceTest {

    @Mock
    private ChatUserRepository chatUserRepository;

    @InjectMocks
    private ContactService contactService;

    private ChatUser alice;
    private ChatUser bob;
    private ChatUser charlie;

    @BeforeEach
    void setUp() {
        alice = ChatUser.builder()
                .userId("user-1").name("Alice").email("alice@test.com")
                .image("alice.png").status("online").connected(true).build();

        bob = ChatUser.builder()
                .userId("user-2").name("Bob").email("bob@test.com")
                .image("bob.png").status("offline").connected(false).build();

        charlie = ChatUser.builder()
                .userId("user-3").name("Charlie").email("charlie@test.com")
                .image("charlie.png").status("online").connected(true).build();
    }

    // ── getContactsGrouped ────────────────────────────────────────────────────

    @Test
    void getContactsGrouped_groupsByFirstLetter() {
        when(chatUserRepository.findAll()).thenReturn(List.of(alice, bob, charlie));

        List<ContactModelResponse> result = contactService.getContactsGrouped();

        assertNotNull(result);
        assertFalse(result.isEmpty());
        // Alice → 'A', Bob → 'B', Charlie → 'C'
        assertEquals(3, result.size());
        assertEquals("A", result.get(0).getTitle());
        assertEquals("B", result.get(1).getTitle());
        assertEquals("C", result.get(2).getTitle());
    }

    @Test
    void getContactsGrouped_emptyRepository_returnsEmpty() {
        when(chatUserRepository.findAll()).thenReturn(List.of());

        List<ContactModelResponse> result = contactService.getContactsGrouped();

        assertTrue(result.isEmpty());
    }

    @Test
    void getContactsGrouped_usersWithSameLetter_groupedTogether() {
        ChatUser anna = ChatUser.builder()
                .userId("user-4").name("Anna").email("anna@test.com").build();

        when(chatUserRepository.findAll()).thenReturn(List.of(alice, anna));

        List<ContactModelResponse> result = contactService.getContactsGrouped();

        assertEquals(1, result.size());
        assertEquals("A", result.get(0).getTitle());
        assertEquals(2, result.get(0).getContacts().size());
    }

    @Test
    void getContactsGrouped_userWithNullName_groupedUnder_hash() {
        ChatUser noName = ChatUser.builder()
                .userId("user-5").name(null).build();

        when(chatUserRepository.findAll()).thenReturn(List.of(noName));

        List<ContactModelResponse> result = contactService.getContactsGrouped();

        assertEquals(1, result.size());
        assertEquals("#", result.get(0).getTitle());
    }

    @Test
    void getContactsGrouped_sortedAlphabetically() {
        when(chatUserRepository.findAll()).thenReturn(List.of(charlie, alice, bob));

        List<ContactModelResponse> result = contactService.getContactsGrouped();

        // Groups should be sorted: A, B, C
        assertEquals("A", result.get(0).getTitle());
        assertEquals("B", result.get(1).getTitle());
        assertEquals("C", result.get(2).getTitle());
    }

    @Test
    void getContactsGrouped_contactsWithinGroupSortedByName() {
        ChatUser anna = ChatUser.builder()
                .userId("user-4").name("Anna").email("anna@test.com").build();

        when(chatUserRepository.findAll()).thenReturn(List.of(alice, anna));

        List<ContactModelResponse> result = contactService.getContactsGrouped();

        List<ContactModelResponse.ContactItem> contacts = result.get(0).getContacts();
        assertEquals("Alice", contacts.get(0).getName());
        assertEquals("Anna",  contacts.get(1).getName());
    }

    // ── getContacts ───────────────────────────────────────────────────────────

    @Test
    void getContacts_delegatesToGetContactsGrouped() {
        when(chatUserRepository.findAll()).thenReturn(List.of(alice, bob));

        List<ContactModelResponse> result = contactService.getContacts("any-user-id");

        assertNotNull(result);
        assertEquals(2, result.size());
        verify(chatUserRepository).findAll();
    }
}
