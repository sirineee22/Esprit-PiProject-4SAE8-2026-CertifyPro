package com.training.platform.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AiController {

    @Value("${openai.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/generate-description")
    public ResponseEntity<String> generateDescription(@RequestBody Map<String, String> request) {
        String shortDescription = request.get("shortDescription");
        if (shortDescription == null || shortDescription.isEmpty()) {
            return ResponseEntity.badRequest().body("Short description is required");
        }
        if (apiKey == null || apiKey.isBlank()) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("OpenAI API key is not configured. Please set OPENAI_API_KEY.");
        }

        String apiUrl = "https://api.openai.com/v1/chat/completions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("model", "gpt-4o-mini");

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content",
                "You are a professional certification program designer. Your goal is to expand a short certification description into a comprehensive, engaging, and professional full description."));
        messages.add(Map.of("role", "user", "content",
                "Please create a detailed full description for a certification based on this short summary: \""
                        + shortDescription
                        + "\". The description should be professional and include: 1. A compelling introduction. 2. Key learning objectives. 3. Career value. Format it with clear headings and bullet points using standard text (not markdown if possible, or simple markdown like bolding)."));

        body.put("messages", messages);
        body.put("temperature", 0.7);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    apiUrl,
                    HttpMethod.POST,
                    entity,
                    new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {
                    });

            Map<String, Object> responseBody = response.getBody();
            if (responseBody == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("OpenAI returned an empty response body.");
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
            if (choices == null || choices.isEmpty()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("OpenAI response 'choices' is empty or missing.");
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> messageMap = (Map<String, Object>) choices.get(0).get("message");
            if (messageMap == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("OpenAI response 'message' is missing.");
            }

            String content = (String) messageMap.get("content");
            if (content == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("OpenAI response 'content' is missing.");
            }

            return ResponseEntity.ok(content);

        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body("OpenAI API error: " + e.getStatusCode().value() + " " + e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal error: " + e.getMessage());
        }
    }

    @PostMapping("/generate-quiz")
    public ResponseEntity<String> generateQuiz(@RequestBody Map<String, String> request) {
        String description = request.get("description");
        if (description == null || description.isEmpty()) {
            return ResponseEntity.badRequest().body("Description is required to generate quiz");
        }
        if (apiKey == null || apiKey.isBlank()) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("OpenAI API key is not configured. Please set OPENAI_API_KEY.");
        }

        String apiUrl = "https://api.openai.com/v1/chat/completions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("model", "gpt-4o-mini");

        String prompt = "Generate 5 multiple-choice questions for an exam based on the following certification description:\n\n"
                +
                description + "\n\n" +
                "The output MUST be a valid JSON array of objects. Each object MUST have these fields:\n" +
                "- questionText: The text of the question\n" +
                "- options: An array of exactly 4 strings (options)\n" +
                "- correctOptionIndex: An integer (0-3) indicating the correct answer\n\n" +
                "Return ONLY the raw JSON array. No explanations or other text.";

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content",
                "You are an expert exam creator. You generate balanced and challenging quiz questions in JSON format."));
        messages.add(Map.of("role", "user", "content", prompt));

        body.put("messages", messages);
        body.put("temperature", 0.7);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    apiUrl,
                    HttpMethod.POST,
                    entity,
                    new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {
                    });

            Map<String, Object> responseBody = response.getBody();
            if (responseBody == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("OpenAI returned empty response");
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
            @SuppressWarnings("unchecked")
            Map<String, Object> messageMap = (Map<String, Object>) choices.get(0).get("message");
            String content = (String) messageMap.get("content");

            // Basic cleanup in case GPT adds markdown wrappers
            if (content.startsWith("```json")) {
                content = content.substring(7);
            }
            if (content.endsWith("```")) {
                content = content.substring(0, content.length() - 3);
            }

            return ResponseEntity.ok(content.trim());

        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body("OpenAI API error: " + e.getStatusCode().value() + " " + e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }
}
