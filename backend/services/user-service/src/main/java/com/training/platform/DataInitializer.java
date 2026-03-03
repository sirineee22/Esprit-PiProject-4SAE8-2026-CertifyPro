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
        // AWS Certified Solutions Architect
        com.training.platform.entity.Certification aws = new com.training.platform.entity.Certification();
        aws.setCode("AWS-SAA");
        aws.setName("AWS Certified Solutions Architect");
        aws.setDescription("Master the design of resilient and scalable distributed systems on the AWS platform.");
        aws.setIsActive(true);
        aws.setRequiredScore(72.0);
        aws.setValidityMonths(36);

        // Google Data Analytics
        com.training.platform.entity.Certification gda = new com.training.platform.entity.Certification();
        gda.setCode("GDA-001");
        gda.setName("Google Data Analytics");
        gda.setDescription(
                "Learn foundational data analytics skills including SQL, R, and Tableau to solve business problems.");
        gda.setIsActive(true);
        gda.setRequiredScore(70.0);
        gda.setValidityMonths(24);

        // Project Management Professional
        com.training.platform.entity.Certification pmp = new com.training.platform.entity.Certification();
        pmp.setCode("PMI-PMP");
        pmp.setName("Project Management Professional (PMP)");
        pmp.setDescription("The global gold standard for project management professionals worldwide.");
        pmp.setIsActive(true);
        pmp.setRequiredScore(70.0);
        pmp.setValidityMonths(36);

        certificationRepository.saveAll(Arrays.asList(aws, gda, pmp));
    }
}
