package com.training.platform.controller;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import com.training.platform.entity.Certification;
import com.training.platform.repository.CertificationRepository;
import com.training.platform.security.JwtUtil;
import com.training.platform.util.CertificationFeeParser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class StripePaymentController {

    private static final long STRIPE_MIN_AMOUNT_CENTS_USD = 50L;

    private final CertificationRepository certificationRepository;
    private final JwtUtil jwtUtil;

    private final String stripeSecretKey;
    private final String frontendOrigin;

    public StripePaymentController(
            CertificationRepository certificationRepository,
            JwtUtil jwtUtil,
            @Value("${stripe.secret-key:}") String stripeSecretKey,
            @Value("${app.frontend-origin:http://localhost:4200}") String frontendOrigin) {
        this.certificationRepository = certificationRepository;
        this.jwtUtil = jwtUtil;
        this.stripeSecretKey = stripeSecretKey != null ? stripeSecretKey.trim() : "";
        this.frontendOrigin = trimTrailingSlash(frontendOrigin != null ? frontendOrigin : "http://localhost:4200");
    }

    private static String trimTrailingSlash(String s) {
        if (s.endsWith("/")) {
            return s.substring(0, s.length() - 1);
        }
        return s;
    }

    @PostMapping("/checkout-session")
    public ResponseEntity<?> createCheckoutSession(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, Object> body) {
        if (stripeSecretKey.isEmpty()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("Stripe is not configured. Set STRIPE_SECRET_KEY.");
        }
        String token = jwtUtil.resolveBearer(authorization);
        if (token == null || !jwtUtil.isTokenValid(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication required");
        }
        Long userId = jwtUtil.extractUserId(token);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
        }
        Object rawId = body != null ? body.get("certificationId") : null;
        if (rawId == null) {
            return ResponseEntity.badRequest().body("certificationId is required");
        }
        long certificationId;
        try {
            certificationId = ((Number) rawId).longValue();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid certificationId");
        }

        Certification cert = certificationRepository.findById(certificationId).orElse(null);
        if (cert == null) {
            return ResponseEntity.notFound().build();
        }
        double feeUsd = CertificationFeeParser.parseFeeUsd(cert.getCriteriaDescription());
        if (feeUsd <= 0) {
            return ResponseEntity.badRequest().body("This certification has no paid exam fee");
        }
        long amountCents = Math.round(feeUsd * 100.0);
        if (amountCents < STRIPE_MIN_AMOUNT_CENTS_USD) {
            return ResponseEntity.badRequest().body("Exam fee must be at least $0.50 USD for card checkout");
        }

        Stripe.apiKey = stripeSecretKey;
        String successUrl = frontendOrigin + "/certifications/" + certificationId + "/exam?session_id={CHECKOUT_SESSION_ID}";
        String cancelUrl = frontendOrigin + "/certifications/" + certificationId;

        Map<String, String> metadata = new HashMap<>();
        metadata.put("certificationId", String.valueOf(certificationId));
        metadata.put("userId", String.valueOf(userId));

        try {
            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(successUrl)
                    .setCancelUrl(cancelUrl)
                    .putAllMetadata(metadata)
                    .addLineItem(
                            SessionCreateParams.LineItem.builder()
                                    .setQuantity(1L)
                                    .setPriceData(
                                            SessionCreateParams.LineItem.PriceData.builder()
                                                    .setCurrency("usd")
                                                    .setUnitAmount(amountCents)
                                                    .setProductData(
                                                            SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                    .setName("Exam registration: " + cert.getName())
                                                                    .build())
                                                    .build())
                                    .build())
                    .build();

            Session session = Session.create(params);
            Map<String, String> out = new HashMap<>();
            out.put("url", session.getUrl());
            return ResponseEntity.ok(out);
        } catch (StripeException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body("Stripe error: " + e.getMessage());
        }
    }

    @GetMapping("/verify-session")
    public ResponseEntity<?> verifySession(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam("sessionId") String sessionId) {
        if (stripeSecretKey.isEmpty()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("Stripe is not configured.");
        }
        if (sessionId == null || sessionId.isBlank()) {
            return ResponseEntity.badRequest().body("sessionId is required");
        }
        String token = jwtUtil.resolveBearer(authorization);
        if (token == null || !jwtUtil.isTokenValid(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication required");
        }
        Long userId = jwtUtil.extractUserId(token);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
        }

        Stripe.apiKey = stripeSecretKey;
        try {
            Session session = Session.retrieve(sessionId);
            if (!"paid".equalsIgnoreCase(session.getPaymentStatus())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Payment not completed");
            }
            Map<String, String> meta = session.getMetadata();
            if (meta == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid session");
            }
            String metaUser = meta.get("userId");
            String metaCert = meta.get("certificationId");
            if (metaUser == null || metaCert == null
                    || !metaUser.equals(String.valueOf(userId))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Session does not match your account");
            }
            long certId = Long.parseLong(metaCert);
            Map<String, Object> out = new HashMap<>();
            out.put("verified", true);
            out.put("certificationId", certId);
            return ResponseEntity.ok(out);
        } catch (StripeException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body("Stripe error: " + e.getMessage());
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body("Invalid session metadata");
        }
    }
}
