package com.esprit.pi.jobcareers.mapper;

import com.esprit.pi.jobcareers.dto.request.CreateCompanyRequest;
import com.esprit.pi.jobcareers.dto.response.CompanyResponse;
import com.esprit.pi.jobcareers.model.Company;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface CompanyMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "rating", ignore = true)
    @Mapping(target = "vacancyCount", ignore = true)
    @Mapping(target = "jobOffers", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Company toEntity(CreateCompanyRequest request);

    CompanyResponse toResponse(Company company);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "rating", ignore = true)
    @Mapping(target = "vacancyCount", ignore = true)
    @Mapping(target = "jobOffers", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateFromRequest(CreateCompanyRequest request, @MappingTarget Company company);
}