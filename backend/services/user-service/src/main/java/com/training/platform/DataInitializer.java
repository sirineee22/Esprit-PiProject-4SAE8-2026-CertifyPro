package com.training.platform;

import com.training.platform.entity.Role;
import com.training.platform.entity.User;
import com.training.platform.repository.RoleRepository;
import com.training.platform.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(RoleRepository roleRepository, UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // Init Roles
        List<String> roles = Arrays.asList("ADMIN", "TRAINER", "LEARNER");
        for (String roleName : roles) {
            if (roleRepository.findByName(roleName).isEmpty()) {
                roleRepository.save(new Role(null, roleName));
            }
        }

        // Init Admin User
        if (userRepository.findByEmailIgnoreCase("admin@platform.com").isEmpty()) {
            Role adminRole = roleRepository.findByName("ADMIN").orElseThrow();
            User admin = new User();
            admin.setFirstName("Admin");
            admin.setLastName("User");
            admin.setEmail("admin@platform.com");
            admin.setPassword(passwordEncoder.encode("Admin123!"));
            admin.setRole(adminRole);
            admin.setActive(true);
            userRepository.save(admin);
            System.out.println(">>> Admin user created. Login: admin@platform.com / Admin123!");
        }

        // Demo trainer (create or repair password/role/active for this email)
        ensureDemoTrainerAccount();
    }

    private static final String DEMO_TRAINER_EMAIL = "trainer@platform.com";
    private static final String DEMO_TRAINER_PASSWORD = "Trainer123!";

    private void ensureDemoTrainerAccount() {
        Role trainerRole = roleRepository.findByName("TRAINER").orElseThrow();
        userRepository.findByEmailIgnoreCase(DEMO_TRAINER_EMAIL).ifPresentOrElse(
                user -> {
                    boolean needsSave = false;
                    if (user.getRole() == null || !"TRAINER".equals(user.getRole().getName())) {
                        user.setRole(trainerRole);
                        needsSave = true;
                    }
                    if (!passwordEncoder.matches(DEMO_TRAINER_PASSWORD, user.getPassword())) {
                        user.setPassword(passwordEncoder.encode(DEMO_TRAINER_PASSWORD));
                        needsSave = true;
                    }
                    if (!user.isActive()) {
                        user.setActive(true);
                        needsSave = true;
                    }
                    if (needsSave) {
                        userRepository.save(user);
                        System.out.println(">>> Demo trainer repaired: " + DEMO_TRAINER_EMAIL + " / " + DEMO_TRAINER_PASSWORD);
                    }
                },
                () -> {
                    User trainer = new User();
                    trainer.setFirstName("Demo");
                    trainer.setLastName("Trainer");
                    trainer.setEmail(DEMO_TRAINER_EMAIL);
                    trainer.setPassword(passwordEncoder.encode(DEMO_TRAINER_PASSWORD));
                    trainer.setRole(trainerRole);
                    trainer.setActive(true);
                    userRepository.save(trainer);
                    System.out.println(">>> Demo trainer created: " + DEMO_TRAINER_EMAIL + " / " + DEMO_TRAINER_PASSWORD);
                });
    }
}
