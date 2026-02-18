package com.training.forum.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * Configuration pour RestTemplate
 * 
 * Note: On n'utilise plus @LoadBalanced car on passe par l'API Gateway
 * qui gère déjà le load balancing vers les services backend.
 * 
 * Architecture: Forum Service → API Gateway → User Service
 */
@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}

