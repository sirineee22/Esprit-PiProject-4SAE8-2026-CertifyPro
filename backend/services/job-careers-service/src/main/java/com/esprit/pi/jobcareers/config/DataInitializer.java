package com.esprit.pi.jobcareers.config;

import com.esprit.pi.jobcareers.enums.ContractType;
import com.esprit.pi.jobcareers.enums.ExperienceLevel;
import com.esprit.pi.jobcareers.model.*;
import com.esprit.pi.jobcareers.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.time.LocalDate;
import java.util.List;
@Configuration
@RequiredArgsConstructor
@Slf4j
@Profile("dev") // ✅ dev only
public class DataInitializer {

    private final JobCategoryRepository categoryRepo;
    private final CompanyRepository companyRepo;
    private final JobOfferRepository jobRepo;

    @Bean
    public CommandLineRunner seedData() {
        return args -> {
            if (categoryRepo.count() == 0) seedCategories();
            if (companyRepo.count() == 0)  seedCompanies();
            if (jobRepo.count() == 0)       seedJobs();
        };
    }

    private void seedCategories() {
        List<JobCategory> cats = List.of(
                JobCategory.builder().name("Business Development").icon("ri-bar-chart-line").description("Rôles de croissance et stratégie").build(),
                JobCategory.builder().name("IT & Software").icon("ri-briefcase-4-line").description("Développement et technologie").build(),
                JobCategory.builder().name("Design, Art & Multimedia").icon("ri-anchor-line").description("Rôles créatifs et design").build(),
                JobCategory.builder().name("Sales & Marketing").icon("ri-thumb-up-line").description("Ventes et marketing").build(),
                JobCategory.builder().name("Education & Training").icon("ri-layout-grid-line").description("Enseignement et formation").build(),
                JobCategory.builder().name("Healthcare").icon("ri-heart-line").description("Médecine et santé").build(),
                JobCategory.builder().name("Project Management").icon("ri-inbox-line").description("Gestion de projets").build(),
                JobCategory.builder().name("Customer Services").icon("ri-phone-line").description("Support et service client").build(),
                JobCategory.builder().name("Accounting / Finance").icon("ri-money-dollar-circle-line").description("Finance et comptabilité").build(),
                JobCategory.builder().name("Digital Marketing").icon("ri-share-circle-line").description("Marketing digital et SEO").build(),
                JobCategory.builder().name("Government Jobs").icon("ri-building-line").description("Secteur public").build(),
                JobCategory.builder().name("Content Writer").icon("ri-file-list-2-line").description("Rédaction et contenu").build(),
                JobCategory.builder().name("Automotive Jobs").icon("ri-settings-2-line").description("Industrie automobile").build(),
                JobCategory.builder().name("Construction / Facilities").icon("ri-user-search-line").description("Construction et facilities").build(),
                JobCategory.builder().name("Catering & Tourism").icon("ri-apps-2-line").description("Hôtellerie et tourisme").build()
        );
        categoryRepo.saveAll(cats);
        log.info("✅ {} catégories créées", cats.size());
    }

    private void seedCompanies() {
        List<Company> companies = List.of(
                Company.builder().name("Themesbrand").industryType("Software")
                        .location("Zuweihir, UAE").country("UAE").department("IT Department")
                        .employeeMin(50).employeeMax(100).rating(4.8)
                        .website("www.themesbrand.com").contactEmail("info@themesbrand.com")
                        .phone("+234-12345-67890").foundedIn(LocalDate.of(2016,1,1))
                        .description("Société logicielle spécialisée dans les templates responsives.")
                        .userId(0L).build(), // ✅ seed placeholder
                Company.builder().name("Syntyce Solutions").industryType("Computer Industry")
                        .location("Stordorf, Germany").country("Germany").department("Engineering")
                        .employeeMin(100).employeeMax(250).rating(4.5)
                        .website("www.syntyce.com").contactEmail("jobs@syntyce.com")
                        .foundedIn(LocalDate.of(2012,3,15)).userId(0L).build(), // ✅
                Company.builder().name("Micro Design").industryType("Financial Services")
                        .location("Escondido, California").country("USA").department("IT Department")
                        .employeeMin(50).employeeMax(100).rating(4.2)
                        .foundedIn(LocalDate.of(2010,6,1)).userId(0L).build(), // ✅
                Company.builder().name("Digitech Galaxy").industryType("Telecommunications")
                        .location("Zhoukou, China").country("China").department("R&D")
                        .employeeMin(250).employeeMax(500).rating(4.3)
                        .foundedIn(LocalDate.of(2008,9,20)).userId(0L).build() // ✅
        );
        companyRepo.saveAll(companies);
        log.info("✅ {} entreprises créées", companies.size());
    }

    private void seedJobs() {
        Company themesbrand = companyRepo.findAll().get(0);
        Company syntyce     = companyRepo.findAll().get(1);
        Company micro       = companyRepo.findAll().get(2);
        Company digitech    = companyRepo.findAll().get(3);

        JobCategory itCat     = categoryRepo.findByName("IT & Software").orElse(null);
        JobCategory designCat = categoryRepo.findByName("Design, Art & Multimedia").orElse(null);
        JobCategory mktCat    = categoryRepo.findByName("Digital Marketing").orElse(null);

        List<JobOffer> jobs = List.of(
                JobOffer.builder()
                        .title("Product Designer").position("Senior Designer")
                        .description("A UI/UX designer's job is to create user-friendly interfaces.")
                        .contractType(ContractType.FULL_TIME)
                        .experienceLevel(ExperienceLevel.FIVE_PLUS_YEARS)
                        .numberOfVacancy(3).startSalary(35000.0).lastSalary(45000.0)
                        .country("UAE").state("Zuweihir").location("Zuweihir, UAE")
                        .lastDateToApply(LocalDate.now().plusMonths(1))
                        .postDate(LocalDate.of(2022,9,15))
                        .tags(List.of("Design","Remote","UI/UX Designer","Designer"))
                        .isUrgent(false).isFeatured(true).applicationCount(54)
                        .company(themesbrand).category(designCat).postedByUserId(0L).build(), // ✅
                JobOffer.builder()
                        .title("Full Stack Engineer").position("Senior Engineer")
                        .description("Build and maintain scalable web applications.")
                        .contractType(ContractType.FULL_TIME)
                        .experienceLevel(ExperienceLevel.THREE_TO_FIVE_YEARS)
                        .numberOfVacancy(5).startSalary(45000.0).lastSalary(65000.0)
                        .country("Germany").state("Stordorf")
                        .lastDateToApply(LocalDate.now().plusMonths(1))
                        .postDate(LocalDate.of(2022,9,11))
                        .tags(List.of("React","Spring Boot","TypeScript","PostgreSQL"))
                        .isUrgent(false).isRemote(true).isFeatured(true).applicationCount(89)
                        .company(syntyce).category(itCat).postedByUserId(0L).build(), // ✅
                JobOffer.builder()
                        .title("Marketing Director").position("Director of Marketing")
                        .description("Lead comprehensive marketing strategies.")
                        .contractType(ContractType.INTERNSHIP)
                        .experienceLevel(ExperienceLevel.FIVE_PLUS_YEARS)
                        .numberOfVacancy(1).startSalary(60000.0).lastSalary(80000.0)
                        .country("Sweden").state("Vinninga")
                        .postDate(LocalDate.of(2022,9,13))
                        .tags(List.of("Marketing","SEO","Strategy"))
                        .isUrgent(true).applicationCount(134)
                        .company(micro).category(mktCat).postedByUserId(0L).build(), // ✅
                JobOffer.builder()
                        .title("React Developer").position("Frontend Developer")
                        .description("Develop modern React applications.")
                        .contractType(ContractType.FREELANCE)
                        .experienceLevel(ExperienceLevel.ONE_TO_TWO_YEARS)
                        .numberOfVacancy(2).startSalary(30000.0).lastSalary(42000.0)
                        .country("Romania").state("Boroaia")
                        .postDate(LocalDate.of(2022,9,14))
                        .tags(List.of("React","JavaScript","TypeScript"))
                        .isUrgent(true).applicationCount(36)
                        .company(digitech).category(itCat).postedByUserId(0L).build() // ✅
        );
        jobRepo.saveAll(jobs);
        log.info("✅ {} offres d'emploi créées", jobs.size());
    }
}