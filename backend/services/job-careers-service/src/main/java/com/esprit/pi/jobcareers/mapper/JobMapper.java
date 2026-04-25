package com.esprit.pi.jobcareers.mapper;

import com.esprit.pi.jobcareers.dto.request.CreateJobOfferRequest;
import com.esprit.pi.jobcareers.dto.request.UpdateJobOfferRequest;
import com.esprit.pi.jobcareers.dto.response.JobOfferResponse;
import com.esprit.pi.jobcareers.model.JobOffer;
import org.mapstruct.*;

import java.time.LocalDate;

@Mapper(
        componentModel = "spring",
        uses = {CompanyMapper.class, JobCategoryMapper.class},
        unmappedSourcePolicy = ReportingPolicy.IGNORE
)
public interface JobMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "applications", ignore = true)
    @Mapping(target = "savedByUsers", ignore = true)
    @Mapping(target = "applicationCount", ignore = true)
    @Mapping(target = "postDate", ignore = true)
    @Mapping(target = "postedByUserId", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    JobOffer toEntity(CreateJobOfferRequest request);

    JobOfferResponse toResponse(JobOffer jobOffer);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "applications", ignore = true)
    @Mapping(target = "savedByUsers", ignore = true)
    @Mapping(target = "applicationCount", ignore = true)
    @Mapping(target = "postDate", ignore = true)
    @Mapping(target = "postedByUserId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateFromRequest(UpdateJobOfferRequest request, @MappingTarget JobOffer jobOffer);

    // =========================
    // Calcul du champ expired
    // =========================
    @AfterMapping
    default void calculateExpired(JobOffer jobOffer, @MappingTarget JobOfferResponse response) {
        if (jobOffer.getLastDateToApply() != null) {
            response.setExpired(jobOffer.getLastDateToApply().isBefore(LocalDate.now()));
        } else {
            response.setExpired(false);
        }
        // Nettoyer les tags vides
        if (response.getTags() != null) {
            response.setTags(
                response.getTags().stream()
                    .filter(t -> t != null && !t.trim().isEmpty())
                    .collect(java.util.stream.Collectors.toList())
            );
        } else {
            response.setTags(new java.util.ArrayList<>());
        }
    }
}