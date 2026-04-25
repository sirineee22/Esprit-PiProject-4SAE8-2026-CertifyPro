package com.esprit.pi.jobcareers.mapper;

import com.esprit.pi.jobcareers.dto.request.CandidateProfileRequest;
import com.esprit.pi.jobcareers.dto.response.CandidateResponse;
import com.esprit.pi.jobcareers.model.Candidate;
import org.mapstruct.*;

@Mapper(componentModel = "spring")

public interface CandidateMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "rating", ignore = true)
    @Mapping(target = "ratingCount", ignore = true)
    @Mapping(target = "applications", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "email", ignore = true)
    Candidate toEntity(CandidateProfileRequest request);

    @Mapping(target = "fullName",
             expression = "java(candidate.getFirstName() + \" \" + candidate.getLastName())")
    CandidateResponse toResponse(Candidate candidate);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "rating", ignore = true)
    @Mapping(target = "ratingCount", ignore = true)
    @Mapping(target = "applications", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "email", ignore = true)
    void updateFromRequest(CandidateProfileRequest request, @MappingTarget Candidate candidate);
}