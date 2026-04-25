package com.esprit.pi.jobcareers.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import jakarta.annotation.PostConstruct;
import java.io.File;
@Configuration
public class FileStorageConfig implements WebMvcConfigurer {

    private final String uploadDir = "./uploads";

    @PostConstruct
    public void init() {
        new File(uploadDir + "/resumes").mkdirs();
        new File(uploadDir + "/logos").mkdirs();
        new File(uploadDir + "/profiles").mkdirs();
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + new File(uploadDir).getAbsolutePath() + "/")
                .setCachePeriod(0);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/uploads/**")
                .allowedOrigins("http://localhost:4200")
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowCredentials(true);
    }

    public String getUploadDir() {
        return uploadDir;
    }
}