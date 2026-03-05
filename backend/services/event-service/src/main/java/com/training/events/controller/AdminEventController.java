package com.training.events.controller;

import com.training.events.entity.Event;
import com.training.events.entity.EventRegistration;
import com.training.events.repository.EventRegistrationRepository;
import com.training.events.repository.EventRepository;
import com.training.events.security.JwtAuthenticationFilter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/events")
public class AdminEventController {

    private final EventRepository eventRepository;
    private final EventRegistrationRepository registrationRepository;

    public AdminEventController(EventRepository eventRepository, EventRegistrationRepository registrationRepository) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
    }

    private boolean isAdmin() {
        Object details = SecurityContextHolder.getContext().getAuthentication().getDetails();
        if (details instanceof JwtAuthenticationFilter.JwtUserDetails u) {
            return "ADMIN".equals(u.role);
        }
        return false;
    }

    @GetMapping
    public ResponseEntity<List<Event>> listAll() {
        if (!isAdmin()) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        List<Event> events = eventRepository.findAll();
        Map<Long, Long> regCountByEventId = registrationRepository.countRegisteredByEventId().stream()
            .collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));
        for (Event e : events) {
            e.setParticipantCount(regCountByEventId.getOrDefault(e.getId(), 0L).intValue());
        }
        return ResponseEntity.ok(events);
    }

    @GetMapping("/stats")
    public ResponseEntity<EventStatsDto> stats() {
        if (!isAdmin()) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        long totalEvents = eventRepository.count();
        EventStatsDto dto = new EventStatsDto();
        dto.setTotalEvents(totalEvents);
        dto.setUpcoming(eventRepository.countByStatus(Event.EventStatus.UPCOMING));
        dto.setCancelled(eventRepository.countByStatus(Event.EventStatus.CANCELLED));
        dto.setDone(eventRepository.countByStatus(Event.EventStatus.DONE));
        dto.setByType(Map.of(
            "WEBINAR", eventRepository.countByType(Event.EventType.WEBINAR),
            "WORKSHOP", eventRepository.countByType(Event.EventType.WORKSHOP),
            "QNA", eventRepository.countByType(Event.EventType.QNA),
            "MEETUP", eventRepository.countByType(Event.EventType.MEETUP),
            "BOOTCAMP", eventRepository.countByType(Event.EventType.BOOTCAMP)
        ));
        dto.setByMode(Map.of(
            "ONLINE", eventRepository.countByMode(Event.EventMode.ONLINE),
            "ONSITE", eventRepository.countByMode(Event.EventMode.ONSITE),
            "HYBRID", eventRepository.countByMode(Event.EventMode.HYBRID)
        ));
        dto.setTotalRegistrations(registrationRepository.countByStatus(EventRegistration.RegistrationStatus.REGISTERED));
        return ResponseEntity.ok(dto);
    }

    @Transactional
    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!isAdmin()) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        if (!eventRepository.existsById(id)) return ResponseEntity.notFound().build();
        registrationRepository.deleteByEventId(id);
        eventRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    public static class EventStatsDto {
        private long totalEvents;
        private long upcoming;
        private long cancelled;
        private long done;
        private Map<String, Long> byType;
        private Map<String, Long> byMode;
        private long totalRegistrations;

        public long getTotalEvents() { return totalEvents; }
        public void setTotalEvents(long totalEvents) { this.totalEvents = totalEvents; }
        public long getUpcoming() { return upcoming; }
        public void setUpcoming(long upcoming) { this.upcoming = upcoming; }
        public long getCancelled() { return cancelled; }
        public void setCancelled(long cancelled) { this.cancelled = cancelled; }
        public long getDone() { return done; }
        public void setDone(long done) { this.done = done; }
        public Map<String, Long> getByType() { return byType; }
        public void setByType(Map<String, Long> byType) { this.byType = byType; }
        public Map<String, Long> getByMode() { return byMode; }
        public void setByMode(Map<String, Long> byMode) { this.byMode = byMode; }
        public long getTotalRegistrations() { return totalRegistrations; }
        public void setTotalRegistrations(long totalRegistrations) { this.totalRegistrations = totalRegistrations; }
    }
}
