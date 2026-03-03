package com.training.platform.service;

import com.training.platform.entity.Formation;
import com.training.platform.entity.Progression;
import com.training.platform.entity.ProgressStatus;
import com.training.platform.entity.User;
import com.training.platform.repository.FormationRepository;
import com.training.platform.repository.ProgressionRepository;
import com.training.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProgressionService {

    private final ProgressionRepository progressionRepository;
    private final UserRepository userRepository;
    private final FormationRepository formationRepository;

    public List<Progression> getUserProgressions(Long userId) {
        return progressionRepository.findByUserId(userId);
    }

    public Optional<Progression> getProgression(Long userId, Long formationId) {
        return progressionRepository.findByUserIdAndFormationId(userId, formationId);
    }

    @Transactional
    public Progression updateProgressionStatus(Long userId, Long formationId, ProgressStatus status) {
        Progression progression = progressionRepository.findByUserIdAndFormationId(userId, formationId)
                .orElseGet(() -> {
                    Progression newProgression = new Progression();
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new RuntimeException("User not found"));
                    Formation formation = formationRepository.findById(formationId)
                            .orElseThrow(() -> new RuntimeException("Formation not found"));
                    newProgression.setUser(user);
                    newProgression.setFormation(formation);
                    return newProgression;
                });

        progression.setStatus(status);
        return progressionRepository.save(progression);
    }
}
