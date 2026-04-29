package com.esprit.pi.jobcareers.service;

import com.esprit.pi.jobcareers.dto.request.CreateCompanyRequest;
import com.esprit.pi.jobcareers.dto.response.CompanyResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface CompanyService {

    CompanyResponse createCompany(HttpServletRequest request, CreateCompanyRequest req);

    CompanyResponse getCompanyById(Long id);

    CompanyResponse getMyCompany(HttpServletRequest request);

    Page<CompanyResponse> getAllCompanies(Pageable pageable);

    Page<CompanyResponse> searchCompanies(String keyword, String industryType, Pageable pageable);

    CompanyResponse updateCompany(Long id, HttpServletRequest request, CreateCompanyRequest req);

    void deleteCompany(Long id, Long userId);

    CompanyResponse uploadLogo(Long id, MultipartFile file, HttpServletRequest request);
}