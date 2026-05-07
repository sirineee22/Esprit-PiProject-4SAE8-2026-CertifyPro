package com.training.platform.service;

import com.training.platform.entity.Formation;
import com.training.platform.repository.FormationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FormationService {
    private final FormationRepository formationRepository;

    public Page<Formation> getAllFormations(Pageable pageable) {
        return formationRepository.findAll(pageable);
    }

    @Cacheable(value = "formation", key = "#id")
    public Optional<Formation> getFormationById(Long id) {
        return formationRepository.findById(id);
    }

    @CacheEvict(value = {"formations", "formation"}, allEntries = true)
    public Formation createFormation(Formation formation) {
        return formationRepository.save(formation);
    }

    public List<Formation> getFormationsByTrainer(Long trainerId) {
        return formationRepository.findByTrainerId(trainerId);
    }

    @CacheEvict(value = {"formations", "formation"}, allEntries = true)
    public void deleteFormation(Long id) {
        formationRepository.deleteById(id);
    }
}
