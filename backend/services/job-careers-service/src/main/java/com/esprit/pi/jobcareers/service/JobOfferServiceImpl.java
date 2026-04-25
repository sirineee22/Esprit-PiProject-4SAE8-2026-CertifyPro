package com.esprit.pi.jobcareers.service;

import com.esprit.pi.jobcareers.dto.request.CreateJobOfferRequest;
import com.esprit.pi.jobcareers.dto.request.UpdateJobOfferRequest;
import com.esprit.pi.jobcareers.dto.response.JobOfferResponse;
import com.esprit.pi.jobcareers.enums.ContractType;
import com.esprit.pi.jobcareers.enums.JobStatus;
import com.esprit.pi.jobcareers.exception.JobException;
import com.esprit.pi.jobcareers.exception.ResourceNotFoundException;
import com.esprit.pi.jobcareers.mapper.JobMapper;
import com.esprit.pi.jobcareers.model.Company;
import com.esprit.pi.jobcareers.model.JobCategory;
import com.esprit.pi.jobcareers.model.JobOffer;
import com.esprit.pi.jobcareers.repository.CompanyRepository;
import com.esprit.pi.jobcareers.repository.JobCategoryRepository;
import com.esprit.pi.jobcareers.repository.JobOfferRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class JobOfferServiceImpl implements JobOfferService {

    private final JobOfferRepository jobOfferRepository;
    private final CompanyRepository companyRepository;
    private final JobCategoryRepository categoryRepository;
    private final JobMapper jobMapper;

    @Override
    public JobOfferResponse createJobOffer(CreateJobOfferRequest request, HttpServletRequest httpRequest) {
        Long userId = SecurityUtils.getCurrentUserId(httpRequest);
        if (userId == null) throw new JobException("Utilisateur non authentifié");

        boolean admin = SecurityUtils.isAdmin(httpRequest);

        return persistNewJobOffer(request, userId, admin);
    }

    @Override
    public JobOfferResponse createJobOffer(CreateJobOfferRequest request, Long userId) {
        if (userId == null) throw new JobException("Utilisateur non authentifié");

        return persistNewJobOffer(request, userId, false);
    }

    private JobOfferResponse persistNewJobOffer(CreateJobOfferRequest request, Long userId, boolean admin) {

        Company company;

        if (request.getCompanyId() != null) {
            // Si un companyId est fourni, vérifier qu’elle existe
            company = companyRepository.findById(request.getCompanyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Entreprise", request.getCompanyId()));
        } else {
            // Sinon récupérer ou créer l’entreprise par défaut de l’utilisateur
            company = companyRepository.findByUserId(userId)
                    .orElseGet(() -> {
                        Company defaultCompany = new Company();
                        defaultCompany.setUserId(userId);
                        defaultCompany.setName(SecurityUtils.getCurrentUsername() + " Entreprise");
                        return companyRepository.save(defaultCompany);
                    });
        }

        // Vérifier que l’entreprise appartient bien à l’utilisateur si pas admin
        if (!admin && !company.getUserId().equals(userId)) {
            throw new JobException("L'entreprise indiquée n'appartient pas à cet utilisateur");
        }

        JobOffer offer = jobMapper.toEntity(request);
        offer.setCompany(company);
        offer.setPostedByUserId(userId);
        offer.setStatus(request.getStatus() != null ? request.getStatus() : JobStatus.ACTIVE);

        if (request.getCategoryId() != null) {
            JobCategory category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Catégorie", request.getCategoryId()));
            offer.setCategory(category);
        }

        JobOffer saved = jobOfferRepository.save(offer);
        log.info("JobOffer created id={} by userId={}", saved.getId(), userId);

        return jobMapper.toResponse(saved);
    }

    // ==========================
    // Lecture
    // ==========================
    @Override
    @Transactional(readOnly = true)
    public JobOfferResponse getJobOfferById(Long id) {
        return jobOfferRepository.findById(id)
                .map(jobMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Offre", id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<JobOfferResponse> getAllJobOffers(Pageable pageable) {
        return jobOfferRepository.findAll(pageable).map(jobMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<JobOfferResponse> searchJobOffers(String keyword, ContractType contractType, Long categoryId,
                                                  LocalDate postDate, String country, Pageable pageable) {
        return jobOfferRepository.searchOffers(keyword, contractType, categoryId, postDate, country, pageable)
                .map(jobMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<JobOfferResponse> getJobOffersByCompany(Long companyId, Pageable pageable) {
        if (!companyRepository.existsById(companyId))
            throw new ResourceNotFoundException("Entreprise", companyId);
        return jobOfferRepository.findByCompanyId(companyId, pageable).map(jobMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<JobOfferResponse> getJobOffersByCategory(Long categoryId, Pageable pageable) {
        if (!categoryRepository.existsById(categoryId))
            throw new ResourceNotFoundException("Catégorie", categoryId);
        return jobOfferRepository.findByCategoryId(categoryId, pageable).map(jobMapper::toResponse);
    }

    // ==========================
    // Update et delete
    // ==========================
    @Override
    public JobOfferResponse updateJobOffer(Long id, UpdateJobOfferRequest request, Long userId) {

        JobOffer offer = jobOfferRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Offre", id));

        jobMapper.updateFromRequest(request, offer);

        if (request.getCompanyId() != null) {
            Company company = companyRepository.findById(request.getCompanyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Entreprise", request.getCompanyId()));
            offer.setCompany(company);
        }

        if (request.getCategoryId() != null) {
            JobCategory category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Catégorie", request.getCategoryId()));
            offer.setCategory(category);
        }

        offer.setPostedByUserId(userId);
        JobOffer saved = jobOfferRepository.save(offer);
        return jobMapper.toResponse(saved);
    }

    @Override
    public void deleteJobOffer(Long id) {
        if (!jobOfferRepository.existsById(id))
            throw new ResourceNotFoundException("Offre", id);
        jobOfferRepository.deleteById(id);
        log.info("JobOffer deleted id={}", id);
    }

    // ==========================
    // Offres spéciales
    // ==========================
    @Override
    @Transactional(readOnly = true)
    public List<JobOfferResponse> getUrgentOffers() {
        return jobOfferRepository.findByIsUrgentTrue().stream().map(jobMapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobOfferResponse> getFeaturedOffers() {
        return jobOfferRepository.findByIsFeaturedTrue().stream().map(jobMapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobOfferResponse> getMyPostedOffers(Long userId) {
        return jobOfferRepository.findByPostedByUserId(userId).stream().map(jobMapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<JobOfferResponse> getMyPostedOffersPage(Long userId, Pageable pageable) {
        return jobOfferRepository.findByPostedByUserId(userId, pageable).map(jobMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobOfferResponse> getTopOffers(int limit) {
        return jobOfferRepository.findTopByApplicationCount(PageRequest.of(0, limit))
                .stream()
                .map(jobMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<JobOfferResponse> getMyPostedOffersPaged(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size,
                org.springframework.data.domain.Sort.by("createdAt").descending());
        return jobOfferRepository.findByPostedByUserId(userId, pageable).map(jobMapper::toResponse);
    }
}