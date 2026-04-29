package com.esprit.pi.jobcareers.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class JobMatchResponse {
    private Long   jobId;
    private String title;
    private String company;
    private String location;
    private String country;
    private String contractType;
    private Boolean isRemote;
    private Boolean isUrgent;
    private List<String> tags;
    private int    matchScore;
    private String postDate;
}
