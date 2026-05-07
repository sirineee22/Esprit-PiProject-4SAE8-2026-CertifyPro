package com.training.platform.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "USER-SERVICE")
public interface UserServiceClient {

    @PutMapping("/api/users/{id}/approve-trainer")
    void approveTrainerRole(@PathVariable("id") Long id);

    @GetMapping("/api/users/{id}/role")
    String getUserRole(@PathVariable("id") Long id);

    @GetMapping("/api/users/search")
    java.util.List<UserDto> searchUsers(@org.springframework.web.bind.annotation.RequestParam("name") String name);

    class UserDto {
        public Long id;
        public String firstName;
        public String lastName;
        public String email;
    }
}
