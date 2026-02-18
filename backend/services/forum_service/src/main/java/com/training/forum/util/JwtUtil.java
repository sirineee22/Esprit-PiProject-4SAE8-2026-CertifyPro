package com.training.forum.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

/**
 * Utilitaire pour extraire les informations du token JWT
 * Utilise la même clé secrète que le user-service pour décoder le token
 */
@Component
public class JwtUtil {

    @Value("${jwt.secret:dev-secret-min-32-chars-for-local-only}")
    private String secret;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Extrait le userId du token JWT
     * @param token Le token JWT
     * @return Le userId extrait du token, ou null si le token est invalide
     */
    public Long extractUserId(String token) {
        try {
            if (token == null || token.isEmpty()) {
                return null;
            }
            
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            
            Object userIdObj = claims.get("userId");
            if (userIdObj instanceof Integer) {
                return ((Integer) userIdObj).longValue();
            } else if (userIdObj instanceof Long) {
                return (Long) userIdObj;
            } else if (userIdObj instanceof Number) {
                return ((Number) userIdObj).longValue();
            }
            
            return null;
        } catch (Exception e) {
            // Token invalide ou expiré
            return null;
        }
    }

    /**
     * Extrait l'email (subject) du token JWT
     */
    public String extractEmail(String token) {
        try {
            if (token == null || token.isEmpty()) {
                return null;
            }
            
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            
            return claims.getSubject();
        } catch (Exception e) {
            return null;
        }
    }
}

