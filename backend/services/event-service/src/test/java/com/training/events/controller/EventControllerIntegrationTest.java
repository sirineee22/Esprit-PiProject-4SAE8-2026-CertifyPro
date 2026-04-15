package com.training.events.controller;

import com.training.events.entity.Event;
import com.training.events.entity.EventRegistration;
import com.training.events.repository.EventRegistrationRepository;
import com.training.events.repository.EventRepository;
import com.training.events.security.JwtAuthenticationFilter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class EventControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private EventRegistrationRepository registrationRepository;

    @MockBean
    private RestTemplate restTemplate;

    private Event testEvent;

    @BeforeEach
    void setUp() {
        registrationRepository.deleteAll();
        eventRepository.deleteAll();

        testEvent = new Event();
        testEvent.setTitle("Test Event");
        testEvent.setTrainerId(100L);
        testEvent.setDateStart(Instant.now().plusSeconds(3600));
        testEvent.setDateEnd(Instant.now().plusSeconds(7200));
        testEvent.setMaxParticipants(50);
        testEvent.setStatus(Event.EventStatus.UPCOMING);
        testEvent = eventRepository.save(testEvent);
    }

    private UsernamePasswordAuthenticationToken getMockAuthentication(Long userId, String role) {
        JwtAuthenticationFilter.JwtUserDetails userDetails = new JwtAuthenticationFilter.JwtUserDetails(userId, role);
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                userId, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
        authentication.setDetails(userDetails);
        return authentication;
    }

    @Test
    void cancelEvent_ShouldUpdateStatusAndNotifyUserService() throws Exception {
        // Arrange
        UsernamePasswordAuthenticationToken auth = getMockAuthentication(100L, "TRAINER");

        EventRegistration reg = new EventRegistration();
        reg.setEvent(testEvent);
        reg.setLearnerId(200L);
        reg.setStatus(EventRegistration.RegistrationStatus.APPROVED);
        registrationRepository.saveAndFlush(reg);

        // Mock the RestTemplate response
        when(restTemplate.postForObject(eq("http://USER-SERVICE/api/users/internal/notifications/event-cancelled"), any(HttpEntity.class), eq(String.class)))
                .thenReturn("OK");

        // Act
        mockMvc.perform(put("/api/events/" + testEvent.getId() + "/cancel")
                        .with(authentication(auth)))
                .andExpect(status().isOk());

        // Assert
        // Verify cross-service communication attempt
        verify(restTemplate).postForObject(eq("http://USER-SERVICE/api/users/internal/notifications/event-cancelled"), any(HttpEntity.class), eq(String.class));
        
        Event updatedEvent = eventRepository.findById(testEvent.getId()).orElseThrow();
        assert(updatedEvent.getStatus() == Event.EventStatus.CANCELLED);

        EventRegistration updatedReg = registrationRepository.findByEventAndLearnerId(testEvent, 200L).orElseThrow();
        assert(updatedReg.getStatus() == EventRegistration.RegistrationStatus.CANCELLED);
    }
}
