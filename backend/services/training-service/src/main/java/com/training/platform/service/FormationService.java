package com.training.platform.service;

import com.training.platform.entity.Formation;
import com.training.platform.repository.FormationRepository;
import lombok.RequiredArgsConstructor;
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

    public Optional<Formation> getFormationById(Long id) {
        return formationRepository.findById(id);
    }

    public Formation createFormation(Formation formation) {
        return formationRepository.save(formation);
    }

    public List<Formation> getFormationsByTrainer(Long trainerId) {
        return formationRepository.findByTrainerId(trainerId);
    }

    public void deleteFormation(Long id) {
        formationRepository.deleteById(id);
    }
}
