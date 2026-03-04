package com.training.platform.repository;

import com.training.platform.entity.Favorite;
import com.training.platform.entity.Formation;
import com.training.platform.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUserId(Long userId);

    Optional<Favorite> findByUserAndFormation(User user, Formation formation);

    boolean existsByUserIdAndFormationId(Long userId, Long formationId);

    void deleteByUserIdAndFormationId(Long userId, Long formationId);
}
