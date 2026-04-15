package com.training.platform.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "USER-SERVICE", path = "/api/users")
public interface UserClient {

    @GetMapping("/{id}")
    UserDTO getUserById(@PathVariable("id") Long id);

}
