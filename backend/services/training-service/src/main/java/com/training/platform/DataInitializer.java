package com.training.platform;

import com.training.platform.entity.Formation;
import com.training.platform.entity.TrainingType;
import com.training.platform.repository.FormationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final FormationRepository formationRepository;

    @Override
    public void run(String... args) throws Exception {
        if (formationRepository.count() == 0) {
            Long trainerId = 1L; // Suppose admin/trainer is ID 1

            // Create some sample formations
            saveFormation("Fullstack Angular & Spring Boot",
                    "Master modern web development with this comprehensive course.",
                    "Advanced", "40h", TrainingType.VIDEO, trainerId);

            saveFormation("Java Microservices with Spring Cloud",
                    "Learn how to build scalable microservices architectures.",
                    "Intermediate", "30h", TrainingType.VIDEO, trainerId);

            saveFormation("Database Design & Optimization",
                    "Expert-led course on PostgreSQL and performance tuning.",
                    "Beginner", "20h", TrainingType.PDF, trainerId);

            System.out.println(">>> Sample Training Data Initialized.");
        }
    }

    private void saveFormation(String title, String desc, String level, String duration, TrainingType type,
            Long trainerId) {
        Formation f = new Formation();
        f.setTitle(title);
        f.setDescription(desc);
        f.setLevel(level);
        f.setDuration(duration);
        f.setTrainingType(type);
        f.setTrainerId(trainerId);
        f.setContentUrl("#"); // Placeholder
        formationRepository.save(f);
    }
}
