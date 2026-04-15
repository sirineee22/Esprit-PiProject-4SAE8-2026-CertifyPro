package com.training.platform.service;

import com.training.platform.entity.User;
import com.training.platform.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

<<<<<<< HEAD
import java.util.Arrays;
import java.util.List;
=======
>>>>>>> origin/Trainings-Evaluation
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

<<<<<<< HEAD
    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setFirstName("Test");
        testUser.setLastName("User");
    }

    @Test
    void getAllUsers_ShouldReturnList() {
        // Arrange
        when(userRepository.findAll()).thenReturn(Arrays.asList(testUser));

        // Act
        List<User> result = userService.getAllUsers();

        // Assert
        assertEquals(1, result.size());
        assertEquals("test@example.com", result.get(0).getEmail());
        verify(userRepository, times(1)).findAll();
    }

    @Test
    void getUserById_WhenUserExists_ShouldReturnUser() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        // Act
        Optional<User> result = userService.getUserById(1L);

        // Assert
        assertTrue(result.isPresent());
        assertEquals("test@example.com", result.get().getEmail());
    }

    @Test
    void createUser_WhenEmailNew_ShouldSaveUser() {
        // Arrange
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = userService.createUser(testUser);

        // Assert
        assertNotNull(result);
        assertEquals("test@example.com", result.getEmail());
        verify(userRepository).save(testUser);
    }

    @Test
    void createUser_WhenEmailExists_ShouldThrowException() {
        // Arrange
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            userService.createUser(testUser);
        });

        assertEquals("Error: Email is already in use!", exception.getMessage());
=======
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
>>>>>>> origin/Trainings-Evaluation
        verify(userRepository, never()).save(any());
    }

    @Test
<<<<<<< HEAD
    void updateUser_WhenUserExists_ShouldUpdateAndSave() {
        // Arrange
        User updatedDetails = new User();
        updatedDetails.setFirstName("Updated");
        updatedDetails.setLastName("Name");
        updatedDetails.setEmail("updated@example.com");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = userService.updateUser(1L, updatedDetails);

        // Assert
        assertNotNull(result);
        assertEquals("Updated", result.getFirstName());
        assertEquals("Name", result.getLastName());
        assertEquals("updated@example.com", result.getEmail());
        verify(userRepository).save(testUser);
    }

    @Test
    void updateUser_WhenUserDoesNotExist_ShouldThrowException() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            userService.updateUser(1L, new User());
        });
        verify(userRepository, never()).save(any());
    }

    @Test
    void deleteUser_ShouldCallRepository() {
        // Act
        userService.deleteUser(1L);

        // Assert
        verify(userRepository, times(1)).deleteById(1L);
=======
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
>>>>>>> origin/Trainings-Evaluation
    }
}
