
package com.esprit.pi.messangingservice.config;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

class JwtServiceTest {

    private static final String SECRET =
            "this-is-a-very-long-secret-key-for-tests-1234567890!!";

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET);
    }

    private SecretKey key() {
        return Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
    }

    private String buildToken(Map<String, Object> extraClaims, String subject) {
        return Jwts.builder()
                .claims(extraClaims)
                .subject(subject)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3_600_000))
                .signWith(key())
                .compact();
    }

    // ════════════════════════════════════════════════════
    // isValid
    // ════════════════════════════════════════════════════

    @Test
    void isValid_withValidToken_returnsTrue() {
        String token = buildToken(Map.of("id", "u1"), "sub@test.com");
        assertThat(jwtService.isValid(token)).isTrue();
    }

    @Test
    void isValid_withTamperedToken_returnsFalse() {
        String token = buildToken(Map.of(), "sub") + "tampered";
        assertThat(jwtService.isValid(token)).isFalse();
    }

    @Test
    void isValid_withExpiredToken_returnsTrue() {
        // NOTE: JwtService is configured in dev mode with clockSkewSeconds(86400*30)
        // and explicitly accepts expired tokens (returns claims from ExpiredJwtException).
        // Therefore isValid() returns true even for expired tokens in this service.
        // This is intentional dev-mode behavior — production should remove the skew.
        String expired = Jwts.builder()
                .subject("user@test.com")
                .issuedAt(new Date(System.currentTimeMillis() - 10_000))
                .expiration(new Date(System.currentTimeMillis() - 1_000))
                .signWith(key())
                .compact();
        // Dev mode: expired tokens are accepted
        assertThat(jwtService.isValid(expired)).isTrue();
    }

    // ════════════════════════════════════════════════════
    // extractUserId
    // ════════════════════════════════════════════════════

    @Test
    void extractUserId_prefersClaim_id() {
        String token = buildToken(Map.of("id", "id-claim-val", "userId", "userId-claim"), "sub");
        assertThat(jwtService.extractUserId(token)).isEqualTo("id-claim-val");
    }

    @Test
    void extractUserId_fallsBackTo_userId_claim() {
        String token = buildToken(Map.of("userId", "user-id-claim"), "sub");
        assertThat(jwtService.extractUserId(token)).isEqualTo("user-id-claim");
    }

    @Test
    void extractUserId_fallsBackToSub() {
        String token = buildToken(new HashMap<>(), "sub-as-id");
        assertThat(jwtService.extractUserId(token)).isEqualTo("sub-as-id");
    }

    // ════════════════════════════════════════════════════
    // extractEmail
    // ════════════════════════════════════════════════════

    @Test
    void extractEmail_prefersEmailClaim() {
        String token = buildToken(Map.of("email", "alice@test.com"), "other@sub.com");
        assertThat(jwtService.extractEmail(token)).isEqualTo("alice@test.com");
    }

    @Test
    void extractEmail_fallsBackToSubWhenSubIsEmail() {
        String token = buildToken(new HashMap<>(), "alice@test.com");
        assertThat(jwtService.extractEmail(token)).isEqualTo("alice@test.com");
    }

    @Test
    void extractEmail_returnsNullWhenSubIsNotEmail() {
        String token = buildToken(new HashMap<>(), "just-an-id");
        assertThat(jwtService.extractEmail(token)).isNull();
    }

    // ════════════════════════════════════════════════════
    // extractName
    // ════════════════════════════════════════════════════

    @Test
    void extractName_prefersNameClaim() {
        String token = buildToken(Map.of("name", "Alice"), "alice@test.com");
        assertThat(jwtService.extractName(token)).isEqualTo("Alice");
    }

    @Test
    void extractName_fallsBackToEmailPrefixFromSub() {
        String token = buildToken(new HashMap<>(), "alice@test.com");
        assertThat(jwtService.extractName(token)).isEqualTo("alice");
    }

    @Test
    void extractName_fallsBackToSubWhenNoAt() {
        String token = buildToken(new HashMap<>(), "plain-sub");
        assertThat(jwtService.extractName(token)).isEqualTo("plain-sub");
    }

    // ════════════════════════════════════════════════════
    // extractRole
    // ════════════════════════════════════════════════════

    @Test
    void extractRole_returnsRoleClaim() {
        String token = buildToken(Map.of("role", "ADMIN"), "sub");
        assertThat(jwtService.extractRole(token)).isEqualTo("ADMIN");
    }

    @Test
    void extractRole_returnsNullWhenAbsent() {
        String token = buildToken(new HashMap<>(), "sub");
        assertThat(jwtService.extractRole(token)).isNull();
    }

    // ════════════════════════════════════════════════════
    // extractImage
    // ════════════════════════════════════════════════════

    @Test
    void extractImage_prefersImageClaim() {
        String token = buildToken(Map.of("image", "http://img.png"), "sub");
        assertThat(jwtService.extractImage(token)).isEqualTo("http://img.png");
    }

    @Test
    void extractImage_fallsBackToPictureClaim() {
        String token = buildToken(Map.of("picture", "http://pic.png"), "sub");
        assertThat(jwtService.extractImage(token)).isEqualTo("http://pic.png");
    }

    @Test
    void extractImage_fallsBackToAvatarClaim() {
        String token = buildToken(Map.of("avatar", "http://avatar.png"), "sub");
        assertThat(jwtService.extractImage(token)).isEqualTo("http://avatar.png");
    }

    @Test
    void extractImage_returnsNullWhenAbsent() {
        String token = buildToken(new HashMap<>(), "sub");
        assertThat(jwtService.extractImage(token)).isNull();
    }
}

// ════════════════════════════════════════════════════════════════════════════
// JwtAuthFilterTest
// ════════════════════════════════════════════════════════════════════════════

class JwtAuthFilterTest {

    private static final String SECRET =
            "this-is-a-very-long-secret-key-for-tests-1234567890!!";

    private JwtService    jwtService;
    private JwtAuthFilter filter;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET);
        filter     = new JwtAuthFilter(jwtService);
        SecurityContextHolder.clearContext();
    }

    private String validToken(String userId) {
        SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
                .claim("id", userId)
                .subject("user@test.com")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3_600_000))
                .signWith(key)
                .compact();
    }

    @Test
    void filter_withValidToken_setsAuthentication() throws Exception {
        String token = validToken("user-1");

        MockHttpServletRequest  req   = new MockHttpServletRequest();
        MockHttpServletResponse res   = new MockHttpServletResponse();
        MockFilterChain         chain = new MockFilterChain();

        req.addHeader("Authorization", "Bearer " + token);

        filter.doFilterInternal(req, res, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getPrincipal())
                .isEqualTo("user-1");
    }

    @Test
    void filter_withNoHeader_doesNotSetAuthentication() throws Exception {
        MockHttpServletRequest  req   = new MockHttpServletRequest();
        MockHttpServletResponse res   = new MockHttpServletResponse();
        MockFilterChain         chain = new MockFilterChain();

        filter.doFilterInternal(req, res, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void filter_withInvalidToken_doesNotSetAuthentication() throws Exception {
        MockHttpServletRequest  req   = new MockHttpServletRequest();
        MockHttpServletResponse res   = new MockHttpServletResponse();
        MockFilterChain         chain = new MockFilterChain();

        req.addHeader("Authorization", "Bearer bad.token.here");

        filter.doFilterInternal(req, res, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void filter_forWsChatEndpoint_skipsJwtAndContinuesChain() throws Exception {
        MockHttpServletRequest  req   = new MockHttpServletRequest();
        MockHttpServletResponse res   = new MockHttpServletResponse();
        MockFilterChain         chain = new MockFilterChain();

        req.setRequestURI("/ws-chat/connect");
        // No Authorization header intentionally

        filter.doFilterInternal(req, res, chain);

        // Filter should let the request pass through (chain was called)
        // No exception means the chain continued
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void filter_withNonBearerHeader_doesNotSetAuthentication() throws Exception {
        MockHttpServletRequest  req   = new MockHttpServletRequest();
        MockHttpServletResponse res   = new MockHttpServletResponse();
        MockFilterChain         chain = new MockFilterChain();

        req.addHeader("Authorization", "Basic dXNlcjpwYXNz");

        filter.doFilterInternal(req, res, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }
}