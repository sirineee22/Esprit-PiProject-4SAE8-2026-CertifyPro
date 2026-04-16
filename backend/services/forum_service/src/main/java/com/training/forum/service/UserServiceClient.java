package com.training.forum.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.ArrayList;
import java.util.Map;

/**
 * Service client pour communiquer avec le user-service via API Gateway
 * 
 * Communication inter-microservices :
 * Forum Service → API Gateway → User Service
 * 
 * On utilise Map<String, Object> pour éviter de dupliquer la structure User
 * dans le forum_service. C'est une approche simple et efficace pour la
 * communication entre microservices.
 */
@Service
public class UserServiceClient {

    private static final Logger logger = LoggerFactory.getLogger(UserServiceClient.class);
    // Communication via API Gateway (bonne pratique microservices)
    private static final String API_GATEWAY_URL = "http://localhost:8081/api/users";

    private final RestTemplate restTemplate;

    public UserServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Vérifie si un utilisateur existe dans le user-service
     * Communication inter-microservices via API Gateway avec authentification JWT
     * 
     * @param userId L'ID de l'utilisateur à vérifier
     * @param token Le token JWT pour l'authentification
     * @return true si l'utilisateur existe et est actif, false sinon
     */
    public boolean userExists(Long userId, String token) {
        try {
            // Appel HTTP vers le user-service via API Gateway avec token JWT
            String url = API_GATEWAY_URL + "/" + userId;
            
            // Créer les headers avec le token d'authentification JWT
            HttpHeaders headers = new HttpHeaders();
            if (token != null && !token.isEmpty()) {
                headers.set("Authorization", "Bearer " + token);
            }
            org.springframework.http.HttpEntity<?> entity = new org.springframework.http.HttpEntity<>(headers);
            
            // Appel avec ParameterizedTypeReference pour le type Map
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url, 
                HttpMethod.GET, 
                entity, 
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> user = response.getBody();
                Boolean active = (Boolean) user.get("active");
                boolean exists = active != null && active;
                logger.info("Communication inter-microservices réussie: User {} existe, actif: {}", userId, exists);
                return exists;
            }
            return false;
        } catch (HttpClientErrorException.NotFound e) {
            logger.warn("User {} n'existe pas dans le user-service", userId);
            return false;
        } catch (Exception e) {
            logger.error("Erreur de communication avec le user-service pour userId {}: {}", userId, e.getMessage());
            return false;
        }
    }

    public Map<String, Object> getUserById(Long userId, String token) {
        try {
            String url = API_GATEWAY_URL + "/" + userId;
            HttpHeaders headers = new HttpHeaders();
            if (token != null && !token.isEmpty()) {
                headers.set("Authorization", "Bearer " + token);
            }
            org.springframework.http.HttpEntity<?> entity = new org.springframework.http.HttpEntity<>(headers);
            
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url, 
                HttpMethod.GET, 
                entity, 
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            
            if (response.getStatusCode() == HttpStatus.OK) {
                return response.getBody();
            }
            return null;
        } catch (Exception e) {
            logger.error("Erreur lors de la récupération de l'utilisateur {}: {}", userId, e.getMessage());
            return null;
        }
        }
    }

    public List<Map<String, Object>> getUsersBatch(List<Long> userIds, String token) {
        if (userIds == null || userIds.isEmpty()) return new ArrayList<>();
        try {
            // Utilise l'endpoint /batch qui n'a pas la restriction 403
            String ids = userIds.stream().map(String::valueOf).reduce((a, b) -> a + "," + b).get();
            String url = API_GATEWAY_URL + "/batch?ids=" + ids;
            
            HttpHeaders headers = new HttpHeaders();
            if (token != null && !token.isEmpty()) {
                headers.set("Authorization", "Bearer " + token);
            }
            org.springframework.http.HttpEntity<?> entity = new org.springframework.http.HttpEntity<>(headers);
            
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                url, 
                HttpMethod.GET, 
                entity, 
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            
            return response.getBody();
        } catch (Exception e) {
            logger.error("Erreur lors de la récupération du batch d'utilisateurs: {}", e.getMessage());
            return new ArrayList<>();
        }
    }
}

