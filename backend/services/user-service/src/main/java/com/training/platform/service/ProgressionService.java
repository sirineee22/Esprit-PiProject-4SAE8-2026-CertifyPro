package com.training.platform.service;

import com.training.platform.entity.UserBadge;
import com.training.platform.entity.UserProgress;
import com.training.platform.entity.XpEventLog;
import com.training.platform.repository.UserBadgeRepository;
import com.training.platform.repository.UserProgressRepository;
import com.training.platform.repository.XpEventLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class ProgressionService {
    private final UserProgressRepository userProgressRepository;
    private final XpEventLogRepository xpEventLogRepository;
    private final UserBadgeRepository userBadgeRepository;

    public ProgressionService(
            UserProgressRepository userProgressRepository,
            XpEventLogRepository xpEventLogRepository,
            UserBadgeRepository userBadgeRepository
    ) {
        this.userProgressRepository = userProgressRepository;
        this.xpEventLogRepository = xpEventLogRepository;
        this.userBadgeRepository = userBadgeRepository;
    }

    @Transactional
    public UserProgress grantXp(Long userId, String action, Long eventId, Integer explicitDelta) {
        if (userId == null || action == null || action.isBlank()) {
            throw new IllegalArgumentException("userId and action are required");
        }

        int delta = explicitDelta != null ? explicitDelta : defaultDelta(action);
        String normalizedAction = action.trim().toUpperCase();

        // Prevent XP farming for event-scoped actions.
        if (eventId != null && xpEventLogRepository.existsByUserIdAndActionAndEventId(userId, normalizedAction, eventId)) {
            return getOrCreateProgress(userId);
        }

        XpEventLog log = new XpEventLog();
        log.setUserId(userId);
        log.setAction(normalizedAction);
        log.setEventId(eventId);
        log.setDelta(delta);
        xpEventLogRepository.save(log);

        UserProgress progress = getOrCreateProgress(userId);
        int newXp = Math.max(0, progress.getXpTotal() + delta);
        progress.setXpTotal(newXp);
        progress.setLevelNumber(levelNumberForXp(newXp));
        progress.setLevelLabel(levelLabelForXp(newXp));
        progress.setUpdatedAt(Instant.now());
        userProgressRepository.save(progress);

        unlockBadges(userId);
        return progress;
    }

    public ProgressionSnapshot getSnapshot(Long userId) {
        UserProgress progress = getOrCreateProgress(userId);
        List<UserBadge> badges = userBadgeRepository.findByUserIdOrderByEarnedAtDesc(userId);
        return new ProgressionSnapshot(progress, badges);
    }

    private UserProgress getOrCreateProgress(Long userId) {
        return userProgressRepository.findByUserId(userId).orElseGet(() -> {
            UserProgress p = new UserProgress();
            p.setUserId(userId);
            p.setXpTotal(0);
            p.setLevelNumber(1);
            p.setLevelLabel("Beginner");
            return userProgressRepository.save(p);
        });
    }

    private int defaultDelta(String action) {
        return switch (action.toUpperCase()) {
            case "ATTEND_EVENT" -> 50;
            case "SUBMIT_FEEDBACK" -> 20;
            case "COMPLETE_LEARNING_STEP" -> 30;
            case "CANCEL_EVENT" -> -20;
            case "NO_SHOW" -> -40;
            case "CREATE_EVENT" -> 20;
            default -> 0;
        };
    }

    private int levelNumberForXp(int xp) {
        if (xp < 100) return 1;
        if (xp < 300) return 2;
        if (xp < 600) return 3;
        return 4;
    }

    private String levelLabelForXp(int xp) {
        if (xp < 100) return "Beginner";
        if (xp < 300) return "Active Learner";
        if (xp < 600) return "Advanced";
        return "Expert";
    }

    private void unlockBadges(Long userId) {
        long attended = xpEventLogRepository.countByUserIdAndAction(userId, "ATTEND_EVENT");
        long feedback = xpEventLogRepository.countByUserIdAndAction(userId, "SUBMIT_FEEDBACK");
        long created = xpEventLogRepository.countByUserIdAndAction(userId, "CREATE_EVENT");

        unlockIfNeeded(userId, "FIRST_EVENT", "First Event", attended >= 1);
        unlockIfNeeded(userId, "ACTIVE_LEARNER", "Active Learner", attended >= 5);
        unlockIfNeeded(userId, "FEEDBACK_MASTER", "Feedback Master", feedback >= 10);
        unlockIfNeeded(userId, "FIRST_EVENT_CREATED", "First Event Created", created >= 1);
    }

    private void unlockIfNeeded(Long userId, String key, String label, boolean condition) {
        if (!condition || userBadgeRepository.existsByUserIdAndBadgeKey(userId, key)) return;
        UserBadge badge = new UserBadge();
        badge.setUserId(userId);
        badge.setBadgeKey(key);
        badge.setBadgeLabel(label);
        userBadgeRepository.save(badge);
    }

    public record ProgressionSnapshot(UserProgress progress, List<UserBadge> badges) {}
}
