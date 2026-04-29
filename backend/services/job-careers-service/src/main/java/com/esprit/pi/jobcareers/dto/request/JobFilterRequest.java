package com.esprit.pi.jobcareers.dto.request;

import com.esprit.pi.jobcareers.enums.ContractType;
import lombok.Data;
import java.time.LocalDate;

@Data
public class JobFilterRequest {
    private String keyword;
    private ContractType contractType;
    private Long categoryId;
    private LocalDate postDate;
    private String country;
    private int page = 0;
    private int size = 10;
}