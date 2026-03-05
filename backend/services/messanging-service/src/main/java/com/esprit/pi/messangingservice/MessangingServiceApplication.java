package com.esprit.pi.messangingservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@SpringBootApplication
@EnableDiscoveryClient
@EnableMongoAuditing
@EnableMongoRepositories(basePackages = "com.esprit.pi.messangingservice") // ← AJOUTEZ CECI
public class MessangingServiceApplication {
	public static void main(String[] args) {
		SpringApplication.run(MessangingServiceApplication.class, args);
	}
}