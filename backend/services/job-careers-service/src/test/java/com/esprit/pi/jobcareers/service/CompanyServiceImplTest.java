package com.esprit.pi.jobcareers.service;

import com.esprit.pi.jobcareers.client.UserClient;
import com.esprit.pi.jobcareers.dto.client.UserDTO;
import com.esprit.pi.jobcareers.dto.request.CreateCompanyRequest;
import com.esprit.pi.jobcareers.dto.response.CompanyResponse;
import com.esprit.pi.jobcareers.exception.DuplicateResourceException;
import com.esprit.pi.jobcareers.mapper.CompanyMapper;
import com.esprit.pi.jobcareers.model.Company;
import com.esprit.pi.jobcareers.repository.CompanyRepository;
import feign.FeignException;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CompanyServiceImplTest {

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private CompanyMapper companyMapper;

    @Mock
    private UserClient userClient;

    @Mock
    private HttpServletRequest httpRequest;

    @InjectMocks
    private CompanyServiceImpl companyService;

    // ✅ TEST 1: CREATE COMPANY SUCCESS
    @Test
    void shouldCreateCompanySuccessfully() {

        Long userId = 1L;

        CreateCompanyRequest request = new CreateCompanyRequest();
        request.setName("TechCorp");

        Company company = new Company();
        Company saved = new Company();
        CompanyResponse response = new CompanyResponse();
        UserDTO user = new UserDTO();

        try (MockedStatic<SecurityUtils> mocked = mockStatic(SecurityUtils.class)) {

            mocked.when(() -> SecurityUtils.getCurrentUserId(httpRequest))
                    .thenReturn(userId);

            when(companyRepository.existsByName("TechCorp")).thenReturn(false);
            when(userClient.getUserById(userId)).thenReturn(user);

            when(companyMapper.toEntity(request)).thenReturn(company);
            when(companyRepository.save(company)).thenReturn(saved);
            when(companyMapper.toResponse(saved)).thenReturn(response);

            CompanyResponse result =
                    companyService.createCompany(httpRequest, request);

            assertNotNull(result);
            verify(companyRepository).save(company);
        }
    }

    // ❌ TEST 2: DUPLICATE COMPANY NAME
    @Test
    void shouldThrowException_whenCompanyAlreadyExists() {

        CreateCompanyRequest request = new CreateCompanyRequest();
        request.setName("TechCorp");

        try (MockedStatic<SecurityUtils> mocked = mockStatic(SecurityUtils.class)) {

            mocked.when(() -> SecurityUtils.getCurrentUserId(httpRequest))
                    .thenReturn(1L);

            when(companyRepository.existsByName("TechCorp"))
                    .thenReturn(true);

            assertThrows(DuplicateResourceException.class, () ->
                    companyService.createCompany(httpRequest, request)
            );
        }
    }

    // ❌ TEST 3: USER ID NULL
    @Test
    void shouldThrowException_whenUserIdMissing() {

        CreateCompanyRequest request = new CreateCompanyRequest();

        try (MockedStatic<SecurityUtils> mocked = mockStatic(SecurityUtils.class)) {

            mocked.when(() -> SecurityUtils.getCurrentUserId(httpRequest))
                    .thenReturn(null);

            assertThrows(RuntimeException.class, () ->
                    companyService.createCompany(httpRequest, request)
            );
        }
    }

    // ❌ TEST 4: USER NOT FOUND (Feign)
    @Test
    void shouldThrowException_whenUserNotFound() {

        CreateCompanyRequest request = new CreateCompanyRequest();
        request.setName("TechCorp");

        try (MockedStatic<SecurityUtils> mocked = mockStatic(SecurityUtils.class)) {

            mocked.when(() -> SecurityUtils.getCurrentUserId(httpRequest))
                    .thenReturn(1L);

            when(companyRepository.existsByName("TechCorp"))
                    .thenReturn(false);

            when(userClient.getUserById(1L))
                    .thenThrow(mock(FeignException.NotFound.class));

            assertThrows(RuntimeException.class, () ->
                    companyService.createCompany(httpRequest, request)
            );
        }
    }

    // ✅ TEST 5: GET COMPANY BY ID
    @Test
    void shouldReturnCompany_whenExists() {

        Company company = new Company();
        CompanyResponse response = new CompanyResponse();

        when(companyRepository.findById(1L))
                .thenReturn(Optional.of(company));
        when(companyMapper.toResponse(company))
                .thenReturn(response);

        CompanyResponse result = companyService.getCompanyById(1L);

        assertNotNull(result);
    }

    // ❌ TEST 6: NOT FOUND
    @Test
    void shouldThrowException_whenCompanyNotFound() {

        when(companyRepository.findById(99L))
                .thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () ->
                companyService.getCompanyById(99L)
        );
    }

    // ✅ TEST 7: DELETE SUCCESS
    @Test
    void shouldDeleteCompany_whenOwner() {

        Long userId = 1L;

        Company company = new Company();
        company.setUserId(userId);

        when(companyRepository.findById(1L))
                .thenReturn(Optional.of(company));

        companyService.deleteCompany(1L, userId);

        verify(companyRepository).delete(company);
    }

    // ❌ TEST 8: DELETE NOT OWNER
    @Test
    void shouldThrowException_whenNotOwner() {

        Company company = new Company();
        company.setUserId(2L);

        when(companyRepository.findById(1L))
                .thenReturn(Optional.of(company));

        assertThrows(RuntimeException.class, () ->
                companyService.deleteCompany(1L, 1L)
        );
    }
}