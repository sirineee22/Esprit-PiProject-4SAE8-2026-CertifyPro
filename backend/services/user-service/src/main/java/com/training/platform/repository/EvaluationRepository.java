package com.training.platform.repository;

import com.training.platform.entity.Evaluation;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {
    List<Evaluation> findByStudentId(Long studentId);

    List<Evaluation> findByFormationId(Long formationId);

    @Query("SELECT e FROM Evaluation e WHERE e.formation.trainer.id = :trainerId")
    List<Evaluation> findByTrainerId(@Param("trainerId") Long trainerId);

    @Query("SELECT COUNT(DISTINCT e.student.id) FROM Evaluation e WHERE e.formation.trainer.id = :trainerId")
    long countDistinctStudentsByTrainerId(@Param("trainerId") Long trainerId);
}
