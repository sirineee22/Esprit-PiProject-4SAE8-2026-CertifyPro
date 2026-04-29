package com.esprit.pi.jobcareers.service;

import com.esprit.pi.jobcareers.config.FileStorageConfig;
import com.esprit.pi.jobcareers.client.UserClient;
import com.esprit.pi.jobcareers.dto.client.UserDTO;
import com.esprit.pi.jobcareers.dto.request.CreateCompanyRequest;
import com.esprit.pi.jobcareers.dto.response.CompanyResponse;
import com.esprit.pi.jobcareers.exception.DuplicateResourceException;
import com.esprit.pi.jobcareers.exception.ResourceNotFoundException;
import com.esprit.pi.jobcareers.mapper.CompanyMapper;
import com.esprit.pi.jobcareers.model.Company;
import com.esprit.pi.jobcareers.repository.CompanyRepository;
import feign.FeignException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CompanyServiceImpl implements CompanyService {

    private final CompanyRepository companyRepository;
    private final CompanyMapper companyMapper;
    private final UserClient userClient;
    private final FileStorageConfig fileStorageConfig;

    @Override
    public CompanyResponse createCompany(HttpServletRequest httpRequest, CreateCompanyRequest request) {

        // ✅ 1. get userId from JWT
        Long userId = SecurityUtils.getCurrentUserId(httpRequest);

        if (userId == null) {
            throw new RuntimeException("Unauthorized: userId missing");
        }

        // ❌ duplicate check
        if (companyRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Entreprise déjà existante : " + request.getName());
        }

        // 🔥 verify user exists via Feign — with proper error handling
        UserDTO user;
        try {
            user = userClient.getUserById(userId);
        } catch (FeignException.NotFound e) {
            throw new ResourceNotFoundException("User introuvable id=" + userId);
        } catch (FeignException e) {
            log.error("user-service unavailable for userId={}", userId, e);
            throw new RuntimeException("user-service unavailable, try again later");
        }

        // ✅ explicit null check
        if (user == null) {
            throw new ResourceNotFoundException("User introuvable id=" + userId);
        }

        // 🏗 create entity
        Company company = companyMapper.toEntity(request);

        // ✅ IMPORTANT
        company.setUserId(userId);

        Company saved = companyRepository.save(company);

        log.info("Entreprise créée id={}, userId={}", saved.getId(), saved.getUserId());

        return companyMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CompanyResponse getCompanyById(Long id) {

        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entreprise", id));

        return companyMapper.toResponse(company);
    }

    @Override
    @Transactional(readOnly = true)
    public CompanyResponse getMyCompany(HttpServletRequest httpRequest) {
        Long userId = SecurityUtils.getCurrentUserId(httpRequest);
        if (userId == null) {
            throw new ResourceNotFoundException("Utilisateur non authentifié");
        }
        return companyRepository.findByUserId(userId)
                .map(companyMapper::toResponse)
                .orElse(null); // Return null instead of 404
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CompanyResponse> getAllCompanies(Pageable pageable) {
        return companyRepository.findAll(pageable)
                .map(companyMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CompanyResponse> searchCompanies(String keyword, String industryType, Pageable pageable) {
        return companyRepository.searchCompanies(keyword, industryType, pageable)
                .map(companyMapper::toResponse);
    }

    @Override
    public CompanyResponse updateCompany(Long id, HttpServletRequest httpRequest, CreateCompanyRequest request) {

        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entreprise", id));

        Long userId = SecurityUtils.getCurrentUserId(httpRequest);
        String userRole = SecurityUtils.getCurrentUserRole(httpRequest);

        // ✅ ADMIN يقدر يعدل على أي شركة — EMPLOYER فقط على شركته
        boolean isAdmin = "ADMIN".equals(userRole);
        boolean isSeedCompany = company.getUserId() == 0L; // seed data placeholder

        if (!isAdmin && !isSeedCompany && !company.getUserId().equals(userId)) {
            throw new RuntimeException("Access denied: not your company");
        }

        // ❌ duplicate name
        if (!company.getName().equals(request.getName())
                && companyRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Nom déjà utilisé : " + request.getName());
        }

        companyMapper.updateFromRequest(request, company);

        // ✅ لو كانت seed company (userId=0) نحدثها بالـ userId الحقيقي
        if (isSeedCompany) {
            company.setUserId(userId);
        }

        Company updated = companyRepository.save(company);

        log.info("Entreprise mise à jour id={} by userId={}", id, userId);

        return companyMapper.toResponse(updated);
    }
    @Override
    public void deleteCompany(Long id, Long userId) {

        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entreprise", id));

        if (!company.getUserId().equals(userId)) {
            throw new RuntimeException("Access denied: not owner");
        }

        companyRepository.delete(company);
    }

    @Override
    public CompanyResponse uploadLogo(Long id, MultipartFile file, HttpServletRequest request) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entreprise", id));

        Long userId = SecurityUtils.getCurrentUserId(request);
        String role = SecurityUtils.getCurrentUserRole(request);

        if (!"ADMIN".equals(role) && !company.getUserId().equals(userId)) {
            throw new RuntimeException("Access denied: not your company");
        }

        try {
            String original  = file.getOriginalFilename();
            String extension = (original != null && original.contains("."))
                    ? original.substring(original.lastIndexOf(".")) : ".png";
            String fileName  = UUID.randomUUID() + extension;

            Path uploadPath = Paths.get(fileStorageConfig.getUploadDir(), "logos");
            Files.createDirectories(uploadPath);
            Files.copy(file.getInputStream(), uploadPath.resolve(fileName),
                    StandardCopyOption.REPLACE_EXISTING);

            company.setLogo("/uploads/logos/" + fileName);
            Company saved = companyRepository.save(company);

            log.info("Logo uploaded for company id={}", id);
            return companyMapper.toResponse(saved);

        } catch (IOException e) {
            log.error("Logo upload error: {}", e.getMessage());
            throw new RuntimeException("Erreur upload logo: " + e.getMessage());
        }
    }
}