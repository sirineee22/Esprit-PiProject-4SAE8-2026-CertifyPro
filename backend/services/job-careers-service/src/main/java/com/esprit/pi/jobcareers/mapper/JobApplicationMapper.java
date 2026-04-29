package com.esprit.pi.jobcareers.mapper;

import com.esprit.pi.jobcareers.dto.response.JobApplicationResponse;
import com.esprit.pi.jobcareers.model.JobApplication;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {JobMapper.class, CandidateMapper.class})
public interface JobApplicationMapper {

    @Mapping(target = "jobOfferId",     source = "jobOffer.id")
    @Mapping(target = "jobTitle",       source = "jobOffer.title")
    @Mapping(target = "candidateId",    source = "candidate.id")
    @Mapping(target = "candidateName",  expression = "java(application.getCandidate().getFirstName() + \" \" + application.getCandidate().getLastName())")
    @Mapping(target = "candidateEmail", source = "candidate.email")
    @Mapping(target = "interviewDate",  source = "interviewDate")
    @Mapping(target = "interviewLink",  source = "interviewLink")
    @Mapping(target = "interviewNotes", source = "interviewNotes")
    JobApplicationResponse toResponse(JobApplication application);
}