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
    private final com.training.platform.repository.CertificationRepository certificationRepository;

    public DataInitializer(RoleRepository roleRepository, UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            com.training.platform.repository.CertificationRepository certificationRepository) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.certificationRepository = certificationRepository;
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

        // Init Certifications
        if (certificationRepository.count() == 0) {
            seedCertifications();
            System.out.println(">>> Sample certifications seeded.");
        }
    }

    private void seedCertifications() {
        List<com.training.platform.entity.Certification> certs = Arrays.asList(
                new com.training.platform.entity.Certification(null, "AWS Certified Solutions Architect",
                        "Amazon Web Services",
                        "Master the design of resilient and scalable distributed systems on the AWS platform.",
                        "Intermediate", "40 hours", "$150", "IT & Cloud", "bi-cloud-check",
                        "linear-gradient(135deg, #FF9900 0%, #FFB84D 100%)"),
                new com.training.platform.entity.Certification(null, "Google Data Analytics",
                        "Google Career Certificates",
                        "Learn foundational data analytics skills including SQL, R, and Tableau to solve business problems.",
                        "Beginner", "180 hours", "$39/mo", "IT & Cloud", "bi-graph-up-arrow",
                        "linear-gradient(135deg, #4285F4 0%, #34A853 100%)"),
                new com.training.platform.entity.Certification(null, "Project Management (PMP)", "PMI Institute",
                        "The global gold standard for project management professionals worldwide.", "Advanced",
                        "35 hours", "$405", "Business", "bi-kanban",
                        "linear-gradient(135deg, #1e3a8a 0%, #6366f1 100%)"));
        certificationRepository.saveAll(certs);
    }
}
