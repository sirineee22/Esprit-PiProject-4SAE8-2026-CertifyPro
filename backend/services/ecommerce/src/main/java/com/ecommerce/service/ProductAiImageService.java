package com.ecommerce.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.file.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ProductAiImageService {

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String API_URL =
            "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell";

    private static final String TOKEN =
            " ";

    public Map<String,Object> generateProductImage(
            String name,
            String description,
            String category
    ){

        try{

            String prompt = buildPrompt(
                    name,
                    description,
                    category
            );

            HttpHeaders headers = new HttpHeaders();

            headers.setBearerAuth(TOKEN);

            headers.setContentType(MediaType.APPLICATION_JSON);

            headers.setAccept(List.of(MediaType.IMAGE_PNG));

            Map<String,Object> body = new HashMap<>();

            body.put("inputs", prompt);

            body.put("parameters", Map.of(
                    "width",1024,
                    "height",1024,
                    "num_inference_steps",4,
                    "guidance_scale",3.5
            ));

            HttpEntity<Map<String,Object>> request =
                    new HttpEntity<>(body,headers);

            ResponseEntity<byte[]> response =
                    restTemplate.exchange(
                            API_URL,
                            HttpMethod.POST,
                            request,
                            byte[].class
                    );

            byte[] image = response.getBody();

            if(image == null || image.length == 0){
                throw new RuntimeException("Image vide");
            }

            String fileName =
                    "product_" +
                            System.currentTimeMillis() +
                            ".png";

            Path folder = Paths.get("uploads/products");

            Files.createDirectories(folder);

            Path filePath = folder.resolve(fileName);

            Files.write(filePath,image);

            return Map.of(
                    "success",true,
                    "imageUrl",
                    "http://localhost:8085/products/" + fileName
            );

        }catch(Exception e){

            return Map.of(
                    "success",false,
                    "error",e.getMessage()
            );
        }
    }

    private String buildPrompt(
            String name,
            String description,
            String category
    ){

        return """
Luxury ecommerce product photo.

Product: %s
Description: %s
Category: %s

white studio background,
premium lighting,
ultra realistic,
amazon product photography,
4k,
professional shadows,
clean composition
""".formatted(
                safe(name),
                safe(description),
                safe(category)
        );
    }

    private String safe(String v){
        return v == null ? "" : v.trim();
    }
}