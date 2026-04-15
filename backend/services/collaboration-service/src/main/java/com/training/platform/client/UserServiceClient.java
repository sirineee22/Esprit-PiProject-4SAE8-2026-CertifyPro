package com.training.platform.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "USER-SERVICE")
public interface UserServiceClient {

    @GetMapping("/api/users/{id}/role")
    String getUserRole(@PathVariable("id") Long id);

    @GetMapping("/api/users/search")
    List<UserDto> searchUsers(@RequestParam("name") String name);

    class UserDto {
        public Long id;
        public String firstName;
        public String lastName;
        public String email;
    }
}
