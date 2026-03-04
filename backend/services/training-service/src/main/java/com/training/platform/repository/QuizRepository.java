package com.training.platform.repository;

import com.training.platform.entity.Quiz;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    @EntityGraph(attributePaths = { "questions", "questions.options" })
    Optional<Quiz> findById(Long id);

    List<Quiz> findByFormationId(Long formationId);

    List<Quiz> findByTrainerId(Long trainerId);
}
