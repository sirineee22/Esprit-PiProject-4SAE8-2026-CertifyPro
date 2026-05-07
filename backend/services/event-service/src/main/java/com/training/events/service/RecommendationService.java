package com.training.events.service;

import com.training.events.entity.Event;
import com.training.events.entity.EventInteraction;
import com.training.events.entity.EventRegistration;
import com.training.events.repository.EventInteractionRepository;
import com.training.events.repository.EventRegistrationRepository;
import com.training.events.repository.EventRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    private static final double INTEREST_WEIGHT = 0.45;
    private static final double PARTICIPATION_WEIGHT = 0.35;
    private static final double POPULARITY_WEIGHT = 0.20;

    private final EventRepository eventRepository;
    private final EventRegistrationRepository registrationRepository;
    private final EventInteractionRepository interactionRepository;

    public RecommendationService(
            EventRepository eventRepository,
            EventRegistrationRepository registrationRepository,
            EventInteractionRepository interactionRepository
    ) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.interactionRepository = interactionRepository;
    }

    public List<Event> getRecommendations(Long userId, int limit) {
        if (userId == null) {
            return List.of();
        }

        int safeLimit = Math.max(1, Math.min(limit, 20));
        Instant now = Instant.now();

        List<Event> upcomingEvents = eventRepository.findByStatusAndDateStartAfterOrderByDateStartAsc(Event.EventStatus.UPCOMING, now);
        if (upcomingEvents.isEmpty()) {
            return List.of();
        }

        List<EventRegistration> history = registrationRepository.findByLearnerIdAndStatusIn(
                userId,
                List.of(
                        EventRegistration.RegistrationStatus.APPROVED,
                        EventRegistration.RegistrationStatus.ATTENDED,
                        EventRegistration.RegistrationStatus.PENDING,
                        EventRegistration.RegistrationStatus.REGISTERED
                )
        );

        Set<Long> alreadyRegistered = history.stream()
                .map(r -> r.getEvent().getId())
                .collect(Collectors.toSet());

        List<Event> candidates = upcomingEvents.stream()
                .filter(e -> !alreadyRegistered.contains(e.getId()))
                .collect(Collectors.toList());
        if (candidates.isEmpty()) {
            return List.of();
        }

        Map<Long, Long> approvedByEvent = toCountMap(registrationRepository.countRegisteredByEventId());
        Map<Long, Long> clicksByEvent = toCountMap(interactionRepository.countByEventGrouped(EventInteraction.InteractionType.CLICK));
        Map<Event.EventType, Double> preferredTypes = buildPreferredTypes(history, interactionRepository.findTop100ByUserIdOrderByCreatedAtDesc(userId));
        Map<Long, Long> trainerAffinity = history.stream()
                .map(EventRegistration::getEvent)
                .filter(Objects::nonNull)
                .filter(e -> e.getTrainerId() != null)
                .collect(Collectors.groupingBy(Event::getTrainerId, Collectors.counting()));

        double maxPopularity = candidates.stream()
                .mapToDouble(e -> popularityRaw(e, approvedByEvent, clicksByEvent))
                .max()
                .orElse(1.0);

        List<ScoredEvent> scored = new ArrayList<>();
        for (Event event : candidates) {
            double interestScore = preferredTypes.getOrDefault(event.getType(), 0.0);

            double trainerScore = trainerAffinity.getOrDefault(event.getTrainerId(), 0L) > 0 ? 1.0 : 0.0;
            long sameModeCount = history.stream()
                    .map(EventRegistration::getEvent)
                    .filter(Objects::nonNull)
                    .filter(h -> h.getMode() == event.getMode())
                    .count();
            double modeScore = history.isEmpty() ? 0.0 : Math.min(1.0, (double) sameModeCount / history.size());
            double participationScore = (trainerScore * 0.6) + (modeScore * 0.4);

            double popularityRaw = popularityRaw(event, approvedByEvent, clicksByEvent);
            double popularityScore = maxPopularity <= 0 ? 0.0 : popularityRaw / maxPopularity;

            double finalScore = (interestScore * INTEREST_WEIGHT)
                    + (participationScore * PARTICIPATION_WEIGHT)
                    + (popularityScore * POPULARITY_WEIGHT);

            List<String> reasons = new ArrayList<>();
            if (interestScore > 0.5) reasons.add("Matches your preferred event types");
            if (trainerScore > 0.0) reasons.add("You joined events from this trainer before");
            if (popularityScore > 0.5) reasons.add("Popular among learners");
            if (reasons.isEmpty()) reasons.add("Upcoming event aligned with your activity");

            event.setRecommendationScore(round(finalScore));
            event.setRecommendationReasons(reasons);
            scored.add(new ScoredEvent(event, finalScore));
        }

        return scored.stream()
                .sorted(Comparator
                        .comparingDouble(ScoredEvent::score).reversed()
                        .thenComparing(s -> s.event().getDateStart()))
                .limit(safeLimit)
                .map(ScoredEvent::event)
                .collect(Collectors.toList());
    }

    private Map<Event.EventType, Double> buildPreferredTypes(List<EventRegistration> history, List<EventInteraction> interactions) {
        Map<Event.EventType, Double> scoreByType = new EnumMap<>(Event.EventType.class);

        for (EventRegistration reg : history) {
            Event event = reg.getEvent();
            if (event != null && event.getType() != null) {
                scoreByType.merge(event.getType(), 1.0, Double::sum);
            }
        }

        for (EventInteraction interaction : interactions) {
            Event event = interaction.getEvent();
            if (event != null && event.getType() != null) {
                if (interaction.getInteractionType() == EventInteraction.InteractionType.CLICK) {
                    scoreByType.merge(event.getType(), 0.4, Double::sum);
                } else if (interaction.getInteractionType() == EventInteraction.InteractionType.REGISTER) {
                    scoreByType.merge(event.getType(), 0.8, Double::sum);
                }
            }
        }

        double max = scoreByType.values().stream().max(Double::compareTo).orElse(0.0);
        if (max <= 0) {
            return scoreByType;
        }

        scoreByType.replaceAll((k, v) -> v / max);
        return scoreByType;
    }

    private double popularityRaw(Event event, Map<Long, Long> approvedByEvent, Map<Long, Long> clicksByEvent) {
        long approved = approvedByEvent.getOrDefault(event.getId(), 0L);
        long clicks = clicksByEvent.getOrDefault(event.getId(), 0L);
        return approved + (clicks * 0.3);
    }

    private Map<Long, Long> toCountMap(List<Object[]> rows) {
        if (rows == null || rows.isEmpty()) {
            return Map.of();
        }
        return rows.stream().filter(Objects::nonNull).collect(Collectors.toMap(
                row -> ((Number) row[0]).longValue(),
                row -> ((Number) row[1]).longValue(),
                Long::sum
        ));
    }

    private double round(double value) {
        return Math.round(value * 1000.0) / 1000.0;
    }

    private record ScoredEvent(Event event, double score) {}
}
