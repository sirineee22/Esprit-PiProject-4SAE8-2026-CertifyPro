package com.esprit.pi.jobcareers.security.jwt;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;

    // secret يلزمه يكون 32 character على الأقل
    private final String secret = "my-super-secret-key-for-testing-123456";

    private Key getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret", secret);
    }

    // ── helper باش نولدو token ──────────────────────────────
    private String generateToken(Map<String, Object> extraClaims, String subject) {
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(subject)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60))
                .signWith(getKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // ── isTokenValid ────────────────────────────────────────

    @Test
    void isTokenValid_validToken_returnsTrue() {
        String token = generateToken(new HashMap<>(), "testuser");
        assertTrue(jwtService.isTokenValid(token));
    }

    @Test
    void isTokenValid_invalidToken_returnsFalse() {
        assertFalse(jwtService.isTokenValid("invalid.token.here"));
    }

    @Test
    void isTokenValid_expiredToken_returnsFalse() {
        String token = Jwts.builder()
                .setSubject("testuser")
                .setIssuedAt(new Date(System.currentTimeMillis() - 10000))
                .setExpiration(new Date(System.currentTimeMillis() - 5000)) // منتهي
                .signWith(getKey(), SignatureAlgorithm.HS256)
                .compact();

        assertFalse(jwtService.isTokenValid(token));
    }

    // ── extractAllClaims ────────────────────────────────────

    @Test
    void extractAllClaims_validToken_returnsCorrectSubject() {
        String token = generateToken(new HashMap<>(), "john");
        assertEquals("john", jwtService.extractAllClaims(token).getSubject());
    }

    // ── extractClaims ───────────────────────────────────────

    @Test
    void extractClaims_withUserId_returnsCorrectUserId() {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", 42);
        String token = generateToken(claims, "john");

        JwtClaims result = jwtService.extractClaims(token);
        assertEquals(42L, result.getUserId());
    }

    @Test
    void extractClaims_withIdField_returnsCorrectUserId() {
        Map<String, Object> claims = new HashMap<>();
        claims.put("id", 99);
        String token = generateToken(claims, "jane");

        JwtClaims result = jwtService.extractClaims(token);
        assertEquals(99L, result.getUserId());
    }

    @Test
    void extractClaims_withRole_returnsCorrectRole() {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", "ADMIN");
        String token = generateToken(claims, "admin");

        JwtClaims result = jwtService.extractClaims(token);
        assertEquals("ADMIN", result.getRole());
    }

    @Test
    void extractClaims_withUsername_returnsCorrectUsername() {
        String token = generateToken(new HashMap<>(), "myuser");

        JwtClaims result = jwtService.extractClaims(token);
        assertEquals("myuser", result.getUsername());
    }

    @Test
    void extractClaims_noUserId_returnsNullUserId() {
        String token = generateToken(new HashMap<>(), "nouser");

        JwtClaims result = jwtService.extractClaims(token);
        assertNull(result.getUserId());
    }
}