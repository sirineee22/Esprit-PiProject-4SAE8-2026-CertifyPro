package com.training.events.service;

import com.training.events.dto.CreateEventRequest;
import com.training.events.entity.Event;
import com.training.events.entity.EventInteraction;
import com.training.events.entity.EventRegistration;
import com.training.events.repository.EventFeedbackRepository;
import com.training.events.repository.EventInteractionRepository;
import com.training.events.repository.EventRegistrationRepository;
import com.training.events.repository.EventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EventServiceTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private EventRegistrationRepository registrationRepository;

    @Mock
    private EventInteractionRepository interactionRepository;

    @Mock
    private EventFeedbackRepository feedbackRepository;

    @Mock
    private EventInteractionService interactionService;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private EventService eventService;

    private Event testEvent;
    private CreateEventRequest request;

    @BeforeEach
    void setUp() {
        testEvent = new Event();
        testEvent.setId(1L);
        testEvent.setTitle("Test Event");
        testEvent.setTrainerId(10L);
        testEvent.setMaxParticipants(50);
        testEvent.setStatus(Event.EventStatus.UPCOMING);
        testEvent.setDateStart(Instant.now().plusSeconds(3600));
        testEvent.setDateEnd(Instant.now().plusSeconds(7200));
        testEvent.setType(Event.EventType.WORKSHOP);
        testEvent.setMode(Event.EventMode.ONLINE);

        request = new CreateEventRequest();
        request.setTitle("Test Event");
        request.setDateStart(Instant.now().plusSeconds(3600));
        request.setDateEnd(Instant.now().plusSeconds(7200));
        request.setMaxParticipants(50);
        request.setMode(Event.EventMode.ONLINE);
        request.setMeetingLink("http://zoom.us");
        request.setType(Event.EventType.WORKSHOP);
    }

    @Test
    void listEvents_ShouldReturnPage() {
        // Arrange
        PageRequest pageRequest = PageRequest.of(0, 10);
        Page<Event> page = new PageImpl<>(Arrays.asList(testEvent));
        when(eventRepository.findAll(pageRequest)).thenReturn(page);
        when(registrationRepository.countByEventIdAndStatusIn(any())).thenReturn(Collections.emptyList());

        // Act
        Page<Event> result = eventService.listEvents(null, null, false, pageRequest);

        // Assert
        assertEquals(1, result.getContent().size());
        verify(eventRepository).findAll(pageRequest);
    }

    @Test
    void listEvents_WithUpcomingOnly_ShouldCallProperRepositoryMethod() {
        // Arrange
        PageRequest pageRequest = PageRequest.of(0, 10);
        Page<Event> page = new PageImpl<>(Arrays.asList(testEvent));
        when(eventRepository.findByStatusAndDateStartAfter(any(), any(), eq(pageRequest))).thenReturn(page);
        when(registrationRepository.countByEventIdAndStatusIn(any())).thenReturn(Collections.emptyList());

        // Act
        eventService.listEvents(null, null, true, pageRequest);

        // Assert
        verify(eventRepository).findByStatusAndDateStartAfter(any(), any(), eq(pageRequest));
    }

    @Test
    void getEvent_WhenExists_ShouldReturnEvent() {
        // Arrange
        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));
        when(registrationRepository.countByEventIdAndStatusIn(any())).thenReturn(Collections.emptyList());

        // Act
        Optional<Event> result = eventService.getEvent(1L);

        // Assert
        assertTrue(result.isPresent());
        verify(eventRepository).findById(1L);
    }

    @Test
    void createEvent_ShouldSaveEvent() {
        // Arrange
        when(eventRepository.save(any(Event.class))).thenReturn(testEvent);

        // Act
        Event result = eventService.createEvent(request, 10L);

        // Assert
        assertNotNull(result);
        assertEquals("Test Event", result.getTitle());
        verify(eventRepository).save(any(Event.class));
    }

    @Test
    void createEvent_WithInvalidDates_ShouldThrowException() {
        // Arrange
        request.setDateStart(Instant.now().minusSeconds(3600));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> eventService.createEvent(request, 10L));
    }

    @Test
    void updateEvent_WhenOwner_ShouldUpdate() {
        // Arrange
        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));
        when(eventRepository.save(any(Event.class))).thenReturn(testEvent);
        when(registrationRepository.findByEventAndStatus(any(), any())).thenReturn(Collections.emptyList());

        // Act
        Event result = eventService.updateEvent(1L, request, false, 10L);

        // Assert
        assertNotNull(result);
        verify(eventRepository).save(any(Event.class));
    }

    @Test
    void register_WhenValid_ShouldCreateRegistration() {
        // Arrange
        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));
        when(registrationRepository.findByEventAndLearnerId(eq(testEvent), anyLong())).thenReturn(Optional.empty());
        when(registrationRepository.findByEventAndStatus(any(), any())).thenReturn(Collections.emptyList());
        when(registrationRepository.save(any(EventRegistration.class))).thenReturn(new EventRegistration());

        // Act
        EventRegistration result = eventService.register(1L, 20L, "John", "Doe");

        // Assert
        assertNotNull(result);
        verify(registrationRepository).save(any(EventRegistration.class));
        verify(interactionService).track(anyLong(), eq(testEvent), eq(EventInteraction.InteractionType.REGISTER));
    }

    @Test
    void register_WhenAlreadyRegistered_ShouldThrowException() {
        // Arrange
        EventRegistration existing = new EventRegistration();
        existing.setStatus(EventRegistration.RegistrationStatus.APPROVED);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));
        when(registrationRepository.findByEventAndLearnerId(testEvent, 20L)).thenReturn(Optional.of(existing));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> eventService.register(1L, 20L, "John", "Doe"));
    }

    @Test
    void register_WhenEventFull_ShouldSetWaitlistStatus() {
        // Arrange
        testEvent.setMaxParticipants(1);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));
        when(registrationRepository.findByEventAndLearnerId(eq(testEvent), anyLong())).thenReturn(Optional.empty());
        
        // Mocking approved list to be full
        when(registrationRepository.findByEventAndStatus(testEvent, EventRegistration.RegistrationStatus.APPROVED))
                .thenReturn(Collections.singletonList(new EventRegistration()));

        when(registrationRepository.save(any(EventRegistration.class))).thenAnswer(i -> i.getArguments()[0]);

        // Act
        EventRegistration result = eventService.register(1L, 20L, "John", "Doe");

        // Assert
        assertEquals(EventRegistration.RegistrationStatus.WAITLISTED, result.getStatus());
    }

    @Test
    void deleteEvent_WhenAllowed_ShouldDelete() {
        // Arrange
        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));

        // Act
        eventService.deleteEvent(1L, false, 10L);

        // Assert
        verify(eventRepository).delete(testEvent);
        verify(registrationRepository).deleteByEventId(1L);
    }

    @Test
    void listEvents_WithFilters_ShouldFilterContent() {
        // Arrange
        PageRequest pageRequest = PageRequest.of(0, 10);
        Page<Event> page = new PageImpl<>(Arrays.asList(testEvent));
        when(eventRepository.findAll(pageRequest)).thenReturn(page);
        when(registrationRepository.countByEventIdAndStatusIn(any())).thenReturn(Collections.emptyList());

        // Act
        // Filtering for a type that matches
        Page<Event> resultMatch = eventService.listEvents(Event.EventType.WORKSHOP, null, false, pageRequest);
        // Filtering for a type that doesn't match
        Page<Event> resultNoMatch = eventService.listEvents(Event.EventType.WEBINAR, null, false, pageRequest);

        // Assert
        assertEquals(1, resultMatch.getContent().size());
        assertEquals(0, resultNoMatch.getContent().size());
    }

    @Test
    void updateEvent_AsAdmin_ShouldUpdate() {
        // Arrange
        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));
        when(eventRepository.save(any(Event.class))).thenReturn(testEvent);
        when(registrationRepository.findByEventAndStatus(any(), any())).thenReturn(Collections.emptyList());

        // Act
        Event result = eventService.updateEvent(1L, request, true, 99L); // Different user but admin

        // Assert
        assertNotNull(result);
        verify(eventRepository).save(any(Event.class));
    }

    @Test
    void updateEvent_NotOwner_ShouldThrowException() {
        // Arrange
        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> eventService.updateEvent(1L, request, false, 99L));
    }

    @Test
    void register_WhenEventFinished_ShouldThrowException() {
        // Arrange
        testEvent.setDateEnd(Instant.now().minusSeconds(3600));
        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> eventService.register(1L, 20L, "John", "Doe"));
    }

    @Test
    void register_WhenEventNotUpcoming_ShouldThrowException() {
        // Arrange
        testEvent.setStatus(Event.EventStatus.CANCELLED);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> eventService.register(1L, 20L, "John", "Doe"));
    }

    @Test
    void updateEvent_WithProgramAndSkills_ShouldUpdateLists() {
        // Arrange
        request.setProgram(Arrays.asList(new com.training.events.dto.ProgramItemDto("10:00", "Intro")));
        request.setRequiredSkills(Arrays.asList("Java", "Spring"));
        
        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));
        when(eventRepository.save(any(Event.class))).thenReturn(testEvent);
        when(registrationRepository.findByEventAndStatus(any(), any())).thenReturn(Collections.emptyList());

        // Act
        Event result = eventService.updateEvent(1L, request, false, 10L);

        // Assert
        assertNotNull(result);
        verify(eventRepository).save(any(Event.class));
    }

    @Test
    void deleteEvent_AsAdmin_ShouldDelete() {
        // Arrange
        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));

        // Act
        eventService.deleteEvent(1L, true, 99L); // Different user but admin

        // Assert
        verify(eventRepository).delete(testEvent);
    }
}
