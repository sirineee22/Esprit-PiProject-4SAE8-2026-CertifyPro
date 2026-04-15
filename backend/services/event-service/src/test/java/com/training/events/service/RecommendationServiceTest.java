package com.training.events.service;

import com.training.events.entity.Event;
import com.training.events.entity.EventInteraction;
import com.training.events.entity.EventRegistration;
import com.training.events.repository.EventInteractionRepository;
import com.training.events.repository.EventRegistrationRepository;
import com.training.events.repository.EventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RecommendationServiceTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private EventRegistrationRepository registrationRepository;

    @Mock
    private EventInteractionRepository interactionRepository;

    @InjectMocks
    private RecommendationService recommendationService;

    private Long userId = 1L;
    private Event testEvent;

    @BeforeEach
    void setUp() {
        testEvent = new Event();
        testEvent.setId(101L);
        testEvent.setTitle("Test Event");
        testEvent.setType(Event.EventType.WORKSHOP);
        testEvent.setMode(Event.EventMode.ONLINE);
        testEvent.setTrainerId(50L);
        testEvent.setDateStart(Instant.now().plusSeconds(3600));
        testEvent.setStatus(Event.EventStatus.UPCOMING);
    }

    @Test
    void getRecommendations_WhenNoUpcomingEvents_ShouldReturnEmptyList() {
        // Arrange
        when(eventRepository.findByStatusAndDateStartAfterOrderByDateStartAsc(eq(Event.EventStatus.UPCOMING), any(Instant.class)))
                .thenReturn(Collections.emptyList());

        // Act
        List<Event> result = recommendationService.getRecommendations(userId, 5);

        // Assert
        assertTrue(result.isEmpty());
    }

    @Test
    void getRecommendations_WhenAlreadyRegistered_ShouldFilterOut() {
        // Arrange
        when(eventRepository.findByStatusAndDateStartAfterOrderByDateStartAsc(eq(Event.EventStatus.UPCOMING), any(Instant.class)))
                .thenReturn(Collections.singletonList(testEvent));
        
        EventRegistration registration = new EventRegistration();
        registration.setEvent(testEvent);
        when(registrationRepository.findByLearnerIdAndStatusIn(eq(userId), anyList()))
                .thenReturn(Collections.singletonList(registration));

        // Act
        List<Event> result = recommendationService.getRecommendations(userId, 5);

        // Assert
        assertTrue(result.isEmpty());
    }

    @Test
    void getRecommendations_WhenUserIsNull_ShouldReturnEmptyList() {
        // Act
        List<Event> result = recommendationService.getRecommendations(null, 5);

        // Assert
        assertTrue(result.isEmpty());
    }

    @Test
    void getRecommendations_WithInteractions_ShouldCalculateScores() {
        // Arrange
        Event otherEvent = new Event();
        otherEvent.setId(102L);
        otherEvent.setTitle("Other Event");
        otherEvent.setType(Event.EventType.WEBINAR);
        otherEvent.setMode(Event.EventMode.ONSITE);
        otherEvent.setTrainerId(51L);
        otherEvent.setDateStart(Instant.now().plusSeconds(7200));
        otherEvent.setStatus(Event.EventStatus.UPCOMING);

        when(eventRepository.findByStatusAndDateStartAfterOrderByDateStartAsc(eq(Event.EventStatus.UPCOMING), any(Instant.class)))
                .thenReturn(Arrays.asList(testEvent, otherEvent));
        
        when(registrationRepository.findByLearnerIdAndStatusIn(eq(userId), anyList()))
                .thenReturn(Collections.emptyList());
        
        when(registrationRepository.countRegisteredByEventId()).thenReturn(Collections.emptyList());
        when(interactionRepository.countByEventGrouped(any())).thenReturn(Collections.emptyList());
        
        EventInteraction interaction = new EventInteraction();
        interaction.setEvent(testEvent);
        interaction.setInteractionType(EventInteraction.InteractionType.CLICK);
        when(interactionRepository.findTop100ByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(Collections.singletonList(interaction));

        // Act
        List<Event> result = recommendationService.getRecommendations(userId, 5);

        // Assert
        assertFalse(result.isEmpty());
        assertEquals(2, result.size());
        // First event should have higher score due to interaction
        assertTrue(result.get(0).getRecommendationScore() >= result.get(1).getRecommendationScore());
    }
}
