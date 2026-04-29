package com.training.events.service;

import com.training.events.entity.Event;
import com.training.events.entity.EventRegistration;
import com.training.events.repository.EventRegistrationRepository;
import com.training.events.repository.EventRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class EventReminderScheduler {
    private final EventRepository eventRepository;
    private final EventRegistrationRepository registrationRepository;
    private final RestTemplate restTemplate;
    private final Set<String> sentKeys = ConcurrentHashMap.newKeySet();

    public EventReminderScheduler(
            EventRepository eventRepository,
            EventRegistrationRepository registrationRepository,
            RestTemplate restTemplate
    ) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.restTemplate = restTemplate;
    }

    // Every minute, notify learners when event starts now (+/- 1 minute window).
    @Scheduled(fixedDelay = 60000)
    public void sendStartNowReminders() {
        Instant now = Instant.now();
        Instant max = now.plus(1, ChronoUnit.MINUTES);
        List<Event> upcoming = eventRepository.findByStatusAndDateStartAfterOrderByDateStartAsc(Event.EventStatus.UPCOMING, now.minus(1, ChronoUnit.MINUTES));

        for (Event event : upcoming) {
            if (event.getDateStart() == null || event.getDateStart().isAfter(max)) continue;
            String key = event.getId() + ":" + event.getDateStart().truncatedTo(ChronoUnit.MINUTES);
            if (!sentKeys.add(key)) continue;

            List<Long> recipientIds = registrationRepository.findByEventAndStatus(event, EventRegistration.RegistrationStatus.APPROVED)
                    .stream().map(EventRegistration::getLearnerId).toList();
            if (recipientIds.isEmpty()) continue;

            try {
                Map<String, Object> payload = new HashMap<>();
                payload.put("recipientIds", recipientIds);
                payload.put("type", "EVENT_STARTING_NOW");
                payload.put("title", "Event is starting now");
                payload.put("message", "Your event \"" + event.getTitle() + "\" is starting now.");
                payload.put("eventId", event.getId());
                restTemplate.postForObject("http://USER-SERVICE/api/users/internal/notifications/dispatch", payload, String.class);
            } catch (Exception e) {
                System.err.println(">>> [WARN] Event start reminder failed: " + e.getMessage());
            }
        }
    }
}
