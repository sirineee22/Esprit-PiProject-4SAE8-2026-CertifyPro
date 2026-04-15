package com.training.events.service;

import com.training.events.entity.Event;
import com.training.events.entity.EventInteraction;
import com.training.events.repository.EventInteractionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EventInteractionServiceTest {

    @Mock
    private EventInteractionRepository interactionRepository;

    @InjectMocks
    private EventInteractionService interactionService;

    private Long userId = 1L;
    private Event testEvent;

    @BeforeEach
    void setUp() {
        testEvent = new Event();
        testEvent.setId(101L);
        testEvent.setTitle("Test Event");
    }

    @Test
    void track_WhenInputIsValid_ShouldSaveInteraction() {
        // Act
        interactionService.track(userId, testEvent, EventInteraction.InteractionType.REGISTER);

        // Assert
        verify(interactionRepository, times(1)).save(any(EventInteraction.class));
    }

    @Test
    void track_WhenInputIsNull_ShouldNotSave() {
        // Act
        interactionService.track(null, testEvent, EventInteraction.InteractionType.CLICK);
        interactionService.track(userId, null, EventInteraction.InteractionType.CLICK);
        interactionService.track(userId, new Event(), EventInteraction.InteractionType.CLICK);
        interactionService.track(userId, testEvent, null);

        // Assert
        verify(interactionRepository, never()).save(any(EventInteraction.class));
    }

    @Test
    void track_WhenRecentClickExists_ShouldNotSaveAgain() {
        // Arrange
        when(interactionRepository.countByUserIdAndEventIdAndInteractionTypeAndCreatedAtAfter(
                eq(userId), eq(101L), eq(EventInteraction.InteractionType.CLICK), any(Instant.class)))
                .thenReturn(1L);

        // Act
        interactionService.track(userId, testEvent, EventInteraction.InteractionType.CLICK);

        // Assert
        verify(interactionRepository, never()).save(any(EventInteraction.class));
    }

    @Test
    void track_WhenNoRecentClick_ShouldSave() {
        // Arrange
        when(interactionRepository.countByUserIdAndEventIdAndInteractionTypeAndCreatedAtAfter(
                eq(userId), eq(101L), eq(EventInteraction.InteractionType.CLICK), any(Instant.class)))
                .thenReturn(0L);

        // Act
        interactionService.track(userId, testEvent, EventInteraction.InteractionType.CLICK);

        // Assert
        verify(interactionRepository, times(1)).save(any(EventInteraction.class));
    }
}
