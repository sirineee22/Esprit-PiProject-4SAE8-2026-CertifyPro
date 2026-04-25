package com.esprit.pi.jobcareers.mapper;

import com.esprit.pi.jobcareers.dto.response.JobCategoryResponse;
import com.esprit.pi.jobcareers.model.JobCategory;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface JobCategoryMapper {

    @Mapping(target = "positionCount",
             expression = "java(category.getPositionCount())")
    JobCategoryResponse toResponse(JobCategory category);
}