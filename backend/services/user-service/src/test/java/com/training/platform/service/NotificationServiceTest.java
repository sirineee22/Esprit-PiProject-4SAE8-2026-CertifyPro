package com.training.platform.service;

import com.training.platform.entity.Notification;
import com.training.platform.entity.User;
import com.training.platform.repository.NotificationRepository;
import com.training.platform.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private NotificationService notificationService;

    @Test
    void dispatchToUsers_WhenUsersExist_ShouldSaveAndEmail() {
        // Arrange
        User user = new User();
        user.setId(1L);
        user.setFirstName("Test");
        user.setEmail("test@example.com");

        when(userRepository.findAllById(anyList())).thenReturn(Arrays.asList(user));

        // Act
        notificationService.dispatchToUsers(Arrays.asList(1L), "INFO", "Title", "Message", 100L);

        // Assert
        verify(notificationRepository, times(1)).save(any(Notification.class));
        verify(emailService, times(1)).sendGenericNotificationEmail(eq("test@example.com"), eq("Test"), eq("Title"), eq("Message"));
    }

    @Test
    void dispatchToUsers_WhenRecipientIdsEmpty_ShouldDoNothing() {
        // Act
        notificationService.dispatchToUsers(Collections.emptyList(), "INFO", "Title", "Message", 100L);

        // Assert
        verify(userRepository, never()).findAllById(anyList());
        verify(notificationRepository, never()).save(any(Notification.class));
    }
}
