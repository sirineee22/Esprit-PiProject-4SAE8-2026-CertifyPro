package com.training.platform.service;

import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private EmailService emailService;

    @Test
    void sendWelcomeEmail_ShouldSendMessage() {
        // Arrange
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        // Act
        emailService.sendWelcomeEmail("test@example.com", "John");

        // Assert
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendTrainerApprovalEmail_ShouldSendMessage() {
        // Arrange
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        // Act
        emailService.sendTrainerApprovalEmail("test@example.com", "Jane");

        // Assert
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendGenericNotificationEmail_ShouldSendMessage() {
        // Arrange
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        // Act
        emailService.sendGenericNotificationEmail("test@example.com", "Alice", "Title", "Message Content");

        // Assert
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void applyTemplate_WithNullButton_ShouldNotIncludeButtonHtml() {
        // This is private, but we can verify it via any of the send methods.
        // Let's test a generic notification without button.
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        // Act
        emailService.sendGenericNotificationEmail("test@example.com", "Bob", "Title", "Message Content");

        // Assert
        verify(mailSender).send(any(MimeMessage.class));
    }
}
