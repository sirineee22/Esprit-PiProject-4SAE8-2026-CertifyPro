package com.training.platform.service;

import com.training.platform.entity.*;
import com.training.platform.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class QuizService {
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository attemptRepository;

    public List<Quiz> getAllQuizzes() {
        return quizRepository.findAll();
    }

    public Optional<Quiz> getQuizById(Long id) {
        return quizRepository.findById(id);
    }

    public List<Quiz> getQuizzesByFormation(Long formationId) {
        return quizRepository.findByFormationId(formationId);
    }

    @Transactional
    public Quiz createQuiz(Quiz quiz) {
        if (quiz.getQuestions() != null) {
            quiz.getQuestions().forEach(q -> {
                q.setQuiz(quiz);
                if (q.getOptions() != null) {
                    q.getOptions().forEach(o -> o.setQuestion(q));
                }
            });
        }
        return quizRepository.save(quiz);
    }

    @Transactional
    public QuizAttempt submitQuizAttempt(User student, Long quizId, Map<?, ?> answers) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        List<Question> questions = quiz.getQuestions();
        int totalQuestions = questions.size();
        int correctAnswers = 0;

        for (Question question : questions) {
            // Flexible retrieval: try Long then String
            Object val = answers.get(question.getId());
            if (val == null) {
                val = answers.get(question.getId().toString());
            }

            if (val != null) {
                Long selectedOptionId = Long.valueOf(val.toString());
                boolean isCorrect = question.getOptions().stream()
                        .filter(o -> o.getId().equals(selectedOptionId))
                        .map(AnswerOption::isCorrect)
                        .findFirst()
                        .orElse(false);

                if (isCorrect) {
                    correctAnswers++;
                }
            }
        }

        double score = totalQuestions > 0 ? (double) correctAnswers / totalQuestions * 100 : 0;

        QuizAttempt attempt = new QuizAttempt();
        attempt.setStudent(student);
        attempt.setQuiz(quiz);
        attempt.setScore(score);
        attempt.setCompletedAt(LocalDateTime.now());

        return attemptRepository.save(attempt);
    }

    public List<QuizAttempt> getMyAttempts(Long studentId) {
        return attemptRepository.findByStudentId(studentId);
    }

    public void deleteQuiz(Long id) {
        quizRepository.deleteById(id);
    }
}
