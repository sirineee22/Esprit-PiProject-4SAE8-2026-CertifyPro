package com.training.platform.service;

import com.training.platform.entity.Favorite;
import com.training.platform.entity.Formation;
import com.training.platform.entity.User;
import com.training.platform.repository.FavoriteRepository;
import com.training.platform.repository.FormationRepository;
import com.training.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FavoriteService {
    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final FormationRepository formationRepository;

    public List<Formation> getUserFavorites(Long userId) {
        return favoriteRepository.findByUserId(userId).stream()
                .map(Favorite::getFormation)
                .collect(Collectors.toList());
    }

    public boolean isFavorite(Long userId, Long formationId) {
        return favoriteRepository.existsByUserIdAndFormationId(userId, formationId);
    }

    @Transactional
    public void toggleFavorite(Long userId, Long formationId) {
        Optional<Favorite> existing = favoriteRepository.findByUserAndFormation(
                userRepository.getReferenceById(userId),
                formationRepository.getReferenceById(formationId));

        if (existing.isPresent()) {
            favoriteRepository.delete(existing.get());
        } else {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            Formation formation = formationRepository.findById(formationId)
                    .orElseThrow(() -> new RuntimeException("Formation not found"));

            Favorite favorite = new Favorite();
            favorite.setUser(user);
            favorite.setFormation(formation);
            favoriteRepository.save(favorite);
        }
    }

    @Transactional
    public void removeFavorite(Long userId, Long formationId) {
        favoriteRepository.deleteByUserIdAndFormationId(userId, formationId);
    }
}
