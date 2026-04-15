package com.training.events;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
@EnableDiscoveryClient
@EnableScheduling
public class EventServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(EventServiceApplication.class, args);
	}

    @Bean
    public CommandLineRunner fixDb(JdbcTemplate jdbcTemplate) {
        return args -> {
            System.out.println(">>> [CRITICAL-FIX] Dropping constraint...");
            try {
                jdbcTemplate.execute("ALTER TABLE event_registrations DROP CONSTRAINT IF EXISTS event_registrations_status_check");
                System.out.println(">>> [CRITICAL-FIX] DONE.");
            } catch (Exception e) {
                System.err.println(">>> [CRITICAL-FIX] FAILED: " + e.getMessage());
            }
        };
    }

    @Bean
    @LoadBalanced
    public RestTemplate restTemplate(org.springframework.boot.web.client.RestTemplateBuilder builder) {
        return builder.build();
    }
}
