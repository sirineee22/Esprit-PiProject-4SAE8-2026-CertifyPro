package com.training.events.service;

import com.training.events.entity.Event;
import com.training.events.entity.EventRegistration;
import com.training.events.repository.EventRegistrationRepository;
import com.training.events.repository.EventRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EventReminderSchedulerTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private EventRegistrationRepository registrationRepository;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private EventReminderScheduler scheduler;

    @Test
    void sendStartNowReminders_WhenEventStarting_ShouldNotifyUsers() {
        // Arrange
        Event event = new Event();
        event.setId(101L);
        event.setTitle("Test Event");
        event.setDateStart(Instant.now().plusSeconds(30));
        event.setStatus(Event.EventStatus.UPCOMING);

        when(eventRepository.findByStatusAndDateStartAfterOrderByDateStartAsc(any(), any()))
                .thenReturn(Arrays.asList(event));
        
        EventRegistration reg = new EventRegistration();
        reg.setLearnerId(200L);
        when(registrationRepository.findByEventAndStatus(eq(event), eq(EventRegistration.RegistrationStatus.APPROVED)))
                .thenReturn(Arrays.asList(reg));

        // Act
        scheduler.sendStartNowReminders();

        // Assert
        verify(restTemplate).postForObject(eq("http://USER-SERVICE/api/users/internal/notifications/dispatch"), any(Map.class), eq(String.class));
    }

    @Test
    void sendStartNowReminders_WhenNoEvents_ShouldDoNothing() {
        // Arrange
        when(eventRepository.findByStatusAndDateStartAfterOrderByDateStartAsc(any(), any()))
                .thenReturn(Collections.emptyList());

        // Act
        scheduler.sendStartNowReminders();

        // Assert
        verify(restTemplate, never()).postForObject(anyString(), any(), any());
    }
}
