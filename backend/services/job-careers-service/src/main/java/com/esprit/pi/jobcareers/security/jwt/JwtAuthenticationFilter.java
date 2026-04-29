package com.esprit.pi.jobcareers.security.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {
            if (jwtService.isTokenValid(token)) {

                JwtClaims claims = jwtService.extractClaims(token);

                String role = claims.getRole();

                // ✅ NORMALISATION DES ROLES
                role = role != null ? role.toUpperCase().trim() : "";

                String roleWithPrefix = "ROLE_" + role;

                if (claims.getUsername() != null &&
                        SecurityContextHolder.getContext().getAuthentication() == null) {

                    List<SimpleGrantedAuthority> authorities =
                            List.of(new SimpleGrantedAuthority(roleWithPrefix));

                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(
                                    claims.getUsername(),
                                    null,
                                    authorities
                            );

                    SecurityContextHolder.getContext().setAuthentication(auth);

                    request.setAttribute("userId", claims.getUserId());
                    request.setAttribute("userRole", role);
                }
            }
        } catch (Exception e) {
            log.error("JWT error: {}", e.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // ✅ IMPORTANT
            return;
        }

        filterChain.doFilter(request, response);
    }
}