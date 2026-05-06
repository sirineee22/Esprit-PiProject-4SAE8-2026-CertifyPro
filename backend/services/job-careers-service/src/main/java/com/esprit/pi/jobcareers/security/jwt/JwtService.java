package com.esprit.pi.jobcareers.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    private Key getKey() {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = digest.digest(secret.getBytes(StandardCharsets.UTF_8));
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public JwtClaims extractClaims(String token) {
        Claims claims = extractAllClaims(token);

        JwtClaims jwtClaims = new JwtClaims();

        // ✅ Essayer plusieurs noms de champs pour userId (JWT peut exposer un Integer)
        Long userId = claims.get("userId", Long.class);
        if (userId == null) {
            Number n = claims.get("userId", Number.class);
            if (n != null) {
                userId = n.longValue();
            }
        }
        if (userId == null) userId = claims.get("id", Long.class);
        if (userId == null) {
            Number n = claims.get("id", Number.class);
            if (n != null) {
                userId = n.longValue();
            }
        }
        if (userId == null) userId = claims.get("user_id", Long.class);
        if (userId == null) {
            Number n = claims.get("user_id", Number.class);
            if (n != null) {
                userId = n.longValue();
            }
        }
        if (userId == null) {
            Object raw = claims.get("userId");
            if (raw == null) raw = claims.get("id");
            if (raw != null) userId = Long.valueOf(raw.toString());
        }

        jwtClaims.setUserId(userId);
        jwtClaims.setUsername(claims.getSubject());
        jwtClaims.setRole(claims.get("role", String.class));

        return jwtClaims;
    }
    public boolean isTokenValid(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}