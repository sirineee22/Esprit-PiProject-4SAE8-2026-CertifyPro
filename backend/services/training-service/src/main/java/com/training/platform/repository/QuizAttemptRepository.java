package com.training.platform.repository;

import com.training.platform.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    List<QuizAttempt> findByStudentId(Long studentId);

    List<QuizAttempt> findByQuizId(Long quizId);

    List<QuizAttempt> findByStudentIdAndQuizId(Long studentId, Long quizId);

    @Query("SELECT a FROM QuizAttempt a WHERE a.quiz.formation.trainerId = :trainerId")
    List<QuizAttempt> findByTrainerId(@Param("trainerId") Long trainerId);

    @Query("SELECT COUNT(DISTINCT a.studentId) FROM QuizAttempt a WHERE a.quiz.formation.trainerId = :trainerId")
    long countDistinctStudentsByTrainerId(@Param("trainerId") Long trainerId);
}
