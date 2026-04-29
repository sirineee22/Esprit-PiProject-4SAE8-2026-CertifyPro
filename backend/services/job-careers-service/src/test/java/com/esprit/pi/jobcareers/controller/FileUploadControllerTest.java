package com.esprit.pi.jobcareers.controller;

import com.esprit.pi.jobcareers.config.FileStorageConfig;
import com.esprit.pi.jobcareers.security.jwt.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.io.File;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(FileUploadController.class)
class FileUploadControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean private JwtService jwtService;
    @MockBean private FileStorageConfig fileStorageConfig;

    @Test
    @WithMockUser
    void shouldUploadResume() throws Exception {

        // ← نقولو لـ mock يرجع مجلد مؤقت
        String tempDir = System.getProperty("java.io.tmpdir");
        new File(tempDir + "/resumes").mkdirs();
        when(fileStorageConfig.getUploadDir()).thenReturn(tempDir);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "cv.pdf",
                "application/pdf",
                "test file content".getBytes()
        );

        mockMvc.perform(multipart("/api/files/upload/resume")
                        .file(file)
                        .with(csrf()))
                .andExpect(status().isOk());
    }
}