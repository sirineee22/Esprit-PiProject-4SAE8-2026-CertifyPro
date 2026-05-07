package com.training.events.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.disable())
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET, "/api/events", "/api/events/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/events").hasRole("TRAINER")
                .requestMatchers(HttpMethod.POST, "/api/events/interactions").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/events/*/feedback").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/events/*").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/events/*/cancel").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/events/*").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/events/my").hasRole("TRAINER")
                .requestMatchers(HttpMethod.POST, "/api/events/*/register").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/events/*/register").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/events/my-registrations").authenticated()
                .requestMatchers("/api/admin/events", "/api/admin/events/**").hasRole("ADMIN")
                .anyRequest().permitAll()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
