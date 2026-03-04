package com.training.platform;

import com.training.platform.entity.Formation;
import com.training.platform.entity.TrainingType;
import com.training.platform.entity.User;
import com.training.platform.repository.FormationRepository;
import com.training.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final FormationRepository formationRepository;
    private final UserRepository userRepository;

    @Override
    public void run(String... args) throws Exception {
        if (formationRepository.count() == 0) {
            Optional<User> admin = userRepository.findByEmailIgnoreCase("admin@platform.com");

            User trainer = admin.orElse(null);

            // Create some sample formations
            saveFormation("Fullstack Angular & Spring Boot",
                    "Master modern web development with this comprehensive course.",
                    "Advanced", "40h", TrainingType.VIDEO, trainer);

            saveFormation("Java Microservices with Spring Cloud",
                    "Learn how to build scalable microservices architectures.",
                    "Intermediate", "30h", TrainingType.VIDEO, trainer);

            saveFormation("Database Design & Optimization",
                    "Expert-led course on PostgreSQL and performance tuning.",
                    "Beginner", "20h", TrainingType.PDF, trainer);

            System.out.println(">>> Sample Training Data Initialized.");
        }
    }

    private void saveFormation(String title, String desc, String level, String duration, TrainingType type,
            User trainer) {
        Formation f = new Formation();
        f.setTitle(title);
        f.setDescription(desc);
        f.setLevel(level);
        f.setDuration(duration);
        f.setTrainingType(type);
        f.setTrainer(trainer);
        f.setContentUrl("#"); // Placeholder
        formationRepository.save(f);
    }
}
