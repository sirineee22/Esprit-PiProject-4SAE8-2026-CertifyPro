package com.esprit.pi.messangingservice.Services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class FileStorageServiceTest {

    @InjectMocks
    private FileStorageService fileStorageService;

    @BeforeEach
    void setUp() {
        // Point upload dir to system temp so no real filesystem setup needed
        ReflectionTestUtils.setField(fileStorageService, "uploadDir",
                System.getProperty("java.io.tmpdir"));
    }

    // ── detectType ────────────────────────────────────────────────────────────

    @Test
    void detectType_imageMime_returnsImage() {
        assertEquals("image", fileStorageService.detectType("image/jpeg"));
        assertEquals("image", fileStorageService.detectType("image/png"));
        assertEquals("image", fileStorageService.detectType("image/gif"));
    }

    @Test
    void detectType_videoMime_returnsVideo() {
        assertEquals("video", fileStorageService.detectType("video/mp4"));
        assertEquals("video", fileStorageService.detectType("video/webm"));
    }

    @Test
    void detectType_audioMime_returnsAudio() {
        assertEquals("audio", fileStorageService.detectType("audio/mpeg"));
        assertEquals("audio", fileStorageService.detectType("audio/ogg"));
    }

    @Test
    void detectType_pdfMime_returnsFile() {
        assertEquals("file", fileStorageService.detectType("application/pdf"));
    }

    @Test
    void detectType_nullMime_returnsFile() {
        assertEquals("file", fileStorageService.detectType(null));
    }

    @Test
    void detectType_unknownMime_returnsFile() {
        assertEquals("file", fileStorageService.detectType("application/octet-stream"));
    }

    // ── formatSize ────────────────────────────────────────────────────────────

    @Test
    void formatSize_bytes_returnsCorrectLabel() {
        assertEquals("500 B", fileStorageService.formatSize(500));
        // Use locale-independent check: contains the number and unit
        String kb = fileStorageService.formatSize(1024);
        assertTrue(kb.contains("1") && kb.contains("KB"),
                "Expected '1.x KB' but was: " + kb);
        String mb = fileStorageService.formatSize(1024 * 1024);
        assertTrue(mb.contains("1") && mb.contains("MB"),
                "Expected '1.x MB' but was: " + mb);
    }

    @Test
    void formatSize_zero_returnsZeroBytes() {
        assertEquals("0 B", fileStorageService.formatSize(0));
    }

    // ── validate ──────────────────────────────────────────────────────────────

    @Test
    void validate_emptyFile_throwsException() {
        MultipartFile empty = new MockMultipartFile("file", new byte[0]);

        assertThrows(IllegalArgumentException.class,
                () -> fileStorageService.validate(empty));
    }

    @Test
    void validate_validFile_doesNotThrow() {
        MultipartFile file = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", "content".getBytes());

        assertDoesNotThrow(() -> fileStorageService.validate(file));
    }

    @Test
    void validate_tooLargeFile_throwsException() {
        // FileStorageService rejects files > 100 MB
        byte[] bigContent = new byte[1];
        MockMultipartFile bigFile = new MockMultipartFile(
                "file", "big.mp4", "video/mp4", bigContent) {
            @Override
            public long getSize() {
                return 110L * 1024 * 1024; // 110 MB — exceeds 100 MB limit
            }
        };

        assertThrows(IllegalArgumentException.class,
                () -> fileStorageService.validate(bigFile));
    }
}
