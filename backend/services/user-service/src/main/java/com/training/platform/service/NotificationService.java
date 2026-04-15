package com.training.platform.service;

import com.training.platform.entity.Notification;
import com.training.platform.entity.User;
import com.training.platform.repository.NotificationRepository;
import com.training.platform.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserRepository userRepository,
            EmailService emailService
    ) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @Transactional
    public void dispatchToUsers(List<Long> recipientIds, String type, String title, String message, Long eventId) {
        if (recipientIds == null || recipientIds.isEmpty()) return;
        List<User> users = userRepository.findAllById(recipientIds);
        for (User user : users) {
            Notification n = new Notification();
            n.setUserId(user.getId());
            n.setType(type);
            n.setTitle(title);
            n.setMessage(message);
            n.setEventId(eventId);
            notificationRepository.save(n);

            if (user.getEmail() != null && !user.getEmail().isBlank()) {
                emailService.sendGenericNotificationEmail(user.getEmail(), user.getFirstName(), title, message);
            }
        }
    }
}
