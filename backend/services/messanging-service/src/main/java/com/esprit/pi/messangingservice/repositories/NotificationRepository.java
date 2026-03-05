package com.esprit.pi.messangingservice.repositories;

import com.esprit.pi.messangingservice.entities.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {

    /** Toutes les notifs non supprimées du destinataire, triées par date desc */
    List<Notification> findByRecipientIdAndDeletedFalseOrderByCreatedAtDesc(String recipientId);

    /** Notifs non lues du destinataire */
    List<Notification> findByRecipientIdAndReadFalseAndDeletedFalse(String recipientId);

    /** Nombre de non-lues */
    long countByRecipientIdAndReadFalseAndDeletedFalse(String recipientId);
}