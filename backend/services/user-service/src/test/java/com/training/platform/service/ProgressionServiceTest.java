package com.training.platform.service;

import com.training.platform.entity.UserBadge;
import com.training.platform.entity.UserProgress;
import com.training.platform.entity.XpEventLog;
import com.training.platform.repository.UserBadgeRepository;
import com.training.platform.repository.UserProgressRepository;
import com.training.platform.repository.XpEventLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProgressionServiceTest {

    @Mock
    private UserProgressRepository userProgressRepository;

    @Mock
    private XpEventLogRepository xpEventLogRepository;

    @Mock
    private UserBadgeRepository userBadgeRepository;

    @InjectMocks
    private ProgressionService progressionService;

    private Long userId = 1L;
    private UserProgress progress;

    @BeforeEach
    void setUp() {
        progress = new UserProgress();
        progress.setUserId(userId);
        progress.setXpTotal(0);
        progress.setLevelNumber(1);
        progress.setLevelLabel("Beginner");
    }

    @Test
    void grantXp_WhenNewAction_ShouldSaveLogAndUpdateProgress() {
        // Arrange
        when(userProgressRepository.findByUserId(userId)).thenReturn(Optional.of(progress));
        when(xpEventLogRepository.existsByUserIdAndActionAndEventId(anyLong(), anyString(), anyLong())).thenReturn(false);
        when(userProgressRepository.save(any(UserProgress.class))).thenReturn(progress);

        // Act
        UserProgress result = progressionService.grantXp(userId, "ATTEND_EVENT", 101L, null);

        // Assert
        assertNotNull(result);
        assertEquals(50, result.getXpTotal());
        assertEquals(1, result.getLevelNumber());
        verify(xpEventLogRepository).save(any(XpEventLog.class));
        verify(userProgressRepository).save(any(UserProgress.class));
    }

    @Test
    void grantXp_WhenDuplicateActionForEvent_ShouldNotGrantAgain() {
        // Arrange
        when(userProgressRepository.findByUserId(userId)).thenReturn(Optional.of(progress));
        when(xpEventLogRepository.existsByUserIdAndActionAndEventId(userId, "ATTEND_EVENT", 101L)).thenReturn(true);

        // Act
        UserProgress result = progressionService.grantXp(userId, "ATTEND_EVENT", 101L, null);

        // Assert
        assertNotNull(result);
        assertEquals(0, result.getXpTotal());
        verify(xpEventLogRepository, never()).save(any(XpEventLog.class));
    }

    @Test
    void grantXp_WhenInvalidInput_ShouldThrowException() {
        assertThrows(IllegalArgumentException.class, () -> progressionService.grantXp(null, "ACTION", 1L, null));
        assertThrows(IllegalArgumentException.class, () -> progressionService.grantXp(1L, null, 1L, null));
        assertThrows(IllegalArgumentException.class, () -> progressionService.grantXp(1L, "", 1L, null));
    }

    @Test
    void getSnapshot_ShouldReturnProgressAndBadges() {
        // Arrange
        UserBadge badge = new UserBadge();
        badge.setUserId(userId);
        badge.setBadgeKey("FIRST_EVENT");
        
        when(userProgressRepository.findByUserId(userId)).thenReturn(Optional.of(progress));
        when(userBadgeRepository.findByUserIdOrderByEarnedAtDesc(userId)).thenReturn(Arrays.asList(badge));

        // Act
        ProgressionService.ProgressionSnapshot snapshot = progressionService.getSnapshot(userId);

        // Assert
        assertNotNull(snapshot);
        assertEquals(progress, snapshot.progress());
        assertEquals(1, snapshot.badges().size());
        assertEquals("FIRST_EVENT", snapshot.badges().get(0).getBadgeKey());
    }

    @Test
    void grantXp_ShouldUnlockBadgesWhenConditionsMet() {
        // Arrange
        progress.setXpTotal(90);
        when(userProgressRepository.findByUserId(userId)).thenReturn(Optional.of(progress));
        when(xpEventLogRepository.existsByUserIdAndActionAndEventId(anyLong(), anyString(), anyLong())).thenReturn(false);
        when(userProgressRepository.save(any(UserProgress.class))).thenReturn(progress);
        
        // Conditions for badges
        when(xpEventLogRepository.countByUserIdAndAction(userId, "ATTEND_EVENT")).thenReturn(1L);
        when(userBadgeRepository.existsByUserIdAndBadgeKey(userId, "FIRST_EVENT")).thenReturn(false);

        // Act
        progressionService.grantXp(userId, "ATTEND_EVENT", 102L, null);

        // Assert
        verify(userBadgeRepository).save(any(UserBadge.class));
    }
}
