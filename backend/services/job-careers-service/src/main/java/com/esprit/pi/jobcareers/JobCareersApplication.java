package com.esprit.pi.jobcareers;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
@EnableScheduling  // ← ajoute ça


public class JobCareersApplication {

    public static void main(String[] args) {
        SpringApplication.run(JobCareersApplication.class, args);
    }
}

