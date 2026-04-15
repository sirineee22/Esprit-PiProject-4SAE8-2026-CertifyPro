package com.training.events.service;

import com.training.events.entity.Event;
import com.training.events.entity.EventInteraction;
import com.training.events.repository.EventInteractionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class EventInteractionService {

    private final EventInteractionRepository interactionRepository;

    public EventInteractionService(EventInteractionRepository interactionRepository) {
        this.interactionRepository = interactionRepository;
    }

    @Transactional
    public void track(Long userId, Event event, EventInteraction.InteractionType interactionType) {
        if (userId == null || event == null || event.getId() == null || interactionType == null) {
            return;
        }

        // Avoid spamming identical click interactions in a very short window.
        if (interactionType == EventInteraction.InteractionType.CLICK) {
            Instant since = Instant.now().minusSeconds(30);
            long recent = interactionRepository.countByUserIdAndEventIdAndInteractionTypeAndCreatedAtAfter(
                    userId, event.getId(), interactionType, since
            );
            if (recent > 0) {
                return;
            }
        }

        EventInteraction interaction = new EventInteraction();
        interaction.setUserId(userId);
        interaction.setEvent(event);
        interaction.setInteractionType(interactionType);
        interactionRepository.save(interaction);
    }
}
