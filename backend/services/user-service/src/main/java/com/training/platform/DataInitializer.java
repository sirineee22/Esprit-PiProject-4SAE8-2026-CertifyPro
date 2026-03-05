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

    public DataInitializer(RoleRepository roleRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
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
        if (roleRepository.findByName("EMPLOYER").isEmpty()) {
            roleRepository.save(new Role(null, "EMPLOYER"));
        }

        // Init Admin User (created on first run if not present)
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
    }
}
