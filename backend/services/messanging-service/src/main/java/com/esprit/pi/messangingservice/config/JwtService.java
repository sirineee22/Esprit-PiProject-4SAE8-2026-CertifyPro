package com.esprit.pi.messangingservice.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Service
public class JwtService {

    private final String secret;

    public JwtService(@Value("${jwt.secret}") String secret) {
        this.secret = secret;
    }

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    private Claims getAllClaims(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        System.out.println("🔍 [JWT] ALL CLAIMS = " + claims); // ← LOG CRITIQUE
        return claims;
    }

    public boolean isValid(String token) {
        try {
            getAllClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String extractUserId(String token) {
        Claims claims = getAllClaims(token);
        // Essaie id, userId, puis sub
        if (claims.get("id") != null)     return claims.get("id").toString();
        if (claims.get("userId") != null) return claims.get("userId").toString();
        return claims.getSubject();
    }
    public String extractEmail(String token) {
        try {
            Claims claims = getAllClaims(token);
            // Essaie claim "email" d'abord
            if (claims.get("email") != null) return claims.get("email").toString();
            // sub contient l'email dans votre cas
            String sub = claims.getSubject();
            if (sub != null && sub.contains("@")) return sub;
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    public String extractName(String token) {
        try {
            Claims claims = getAllClaims(token);

            // Votre JWT n'a pas "name" → on va directement au sub
            if (claims.get("name") != null && !claims.get("name").toString().isBlank())
                return claims.get("name").toString();

            // sub = sisi@gmail.com → retourne "sisi"
            String sub = claims.getSubject();
            if (sub != null && !sub.isBlank())
                return sub.contains("@") ? sub.split("@")[0] : sub;

            return null;
        } catch (Exception e) {
            return null;
        }
    }

    public String extractRole(String token) {
        try {
            Object role = getAllClaims(token).get("role");
            return role != null ? role.toString() : null;
        } catch (Exception e) {
            return null;
        }
    }


    public String extractImage(String token) {
        try {
            Claims claims = getAllClaims(token);
            if (claims.get("image")   != null) return claims.get("image").toString();
            if (claims.get("picture") != null) return claims.get("picture").toString();
            if (claims.get("avatar")  != null) return claims.get("avatar").toString();
            return null;
        } catch (Exception e) {
            return null;
        }
    }
}