package com.esprit.pi.jobcareers.client;

import com.esprit.pi.jobcareers.config.FeignConfig;
import com.esprit.pi.jobcareers.dto.client.UserDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-service", url = "${user-service.url}", configuration = FeignConfig.class)

public interface UserClient {

    @GetMapping("/api/users/{id}")
    UserDTO getUserById(@PathVariable("id") Long id);
}