package com.training.platform.service;

import com.training.platform.entity.User;
import com.training.platform.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setEmail("test@esprit.tn");
        user.setFirstName("Khalil");
        user.setLastName("Test");
    }

    @Test
    void getUserById_ShouldReturnUser() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        Optional<User> result = userService.getUserById(1L);

        assertTrue(result.isPresent());
        assertEquals("test@esprit.tn", result.get().getEmail());
    }

    @Test
    void createUser_WithExistingEmail_ShouldThrowException() {
        when(userRepository.existsByEmail("test@esprit.tn")).thenReturn(true);

        assertThrows(RuntimeException.class, () -> userService.createUser(user));
        verify(userRepository, never()).save(any());
    }

    @Test
    void createUser_WithNewEmail_ShouldSaveUser() {
        when(userRepository.existsByEmail("test@esprit.tn")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(user);

        User savedUser = userService.createUser(user);

        assertNotNull(savedUser);
        assertEquals("test@esprit.tn", savedUser.getEmail());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void updateUser_ExistingUser_ShouldSuccess() {
        User details = new User();
        details.setFirstName("Updated");
        details.setLastName("User");
        details.setEmail("updated@esprit.tn");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        User result = userService.updateUser(1L, details);

        assertNotNull(result);
        assertEquals("Updated", user.getFirstName());
        verify(userRepository).save(user);
    }
}
