package com.training.platform.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Reads exam fee (USD) from the JSON blob stored in {@code Certification.criteriaDescription}.
 */
public final class CertificationFeeParser {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private CertificationFeeParser() {
    }

    /**
     * @return fee in USD, &gt; 0 if paid exam; 0 if free or missing/invalid
     */
    public static double parseFeeUsd(String criteriaDescription) {
        if (criteriaDescription == null || criteriaDescription.isBlank()) {
            return 0;
        }
        try {
            JsonNode root = MAPPER.readTree(criteriaDescription);
            if (!root.has("price") || root.get("price").isNull()) {
                return 0;
            }
            String raw = root.get("price").asText("").trim();
            if (raw.isEmpty()) {
                return 0;
            }
            String cleaned = raw.replaceAll("[^0-9.]", "");
            if (cleaned.isEmpty()) {
                return 0;
            }
            double v = Double.parseDouble(cleaned);
            return v > 0 ? v : 0;
        } catch (Exception e) {
            return 0;
        }
    }
}
