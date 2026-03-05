package com.esprit.pi.messangingservice.Services;

import com.esprit.pi.messangingservice.DTO.ConnectRequest;
import com.esprit.pi.messangingservice.entities.ChatUser;
import com.esprit.pi.messangingservice.repositories.ChatUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatUserService {

    private final ChatUserRepository userRepository;

    public ChatUser connect(ConnectRequest req) {
        // ✅ FIX: userId ne doit jamais être null
        if (req.getUserId() == null || req.getUserId().isBlank()) {
            throw new IllegalArgumentException("userId cannot be null or blank");
        }

        ChatUser user = userRepository
                .findByUserId(req.getUserId())
                .orElse(ChatUser.builder()
                        .userId(req.getUserId())
                        .build());

        // ✅ FIX: fallback si name null (JWT ne contient pas le claim "name")
        String name = req.getName();
        if (name == null || name.isBlank()) {
            name = req.getEmail() != null && !req.getEmail().isBlank()
                    ? req.getEmail().split("@")[0]   // prend la partie avant @
                    : "User-" + req.getUserId();
        }

        user.setName(name);
        user.setImage(req.getImage() != null ? req.getImage() : "");
        user.setEmail(req.getEmail() != null ? req.getEmail() : "");
        user.setStatus("online");
        user.setConnected(true);

        return userRepository.save(user);
    }

    public ChatUser disconnect(String userId) {
        ChatUser user = userRepository
                .findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        user.setStatus("offline");
        user.setConnected(false);
        return userRepository.save(user);
    }

    public Optional<ChatUser> findByUserId(String userId) {
        if (userId == null || userId.isBlank()) return Optional.empty();
        return userRepository.findByUserId(userId);
    }

    public List<ChatUser> getAllUsers() {
        return userRepository.findAllByOrderByNameAsc();
    }

    public List<ChatUser> getOnlineUsers() {
        return userRepository.findByConnectedTrue();
    }
    public List<Map<String, Object>> searchUsers(String query, String excludeUserId) {
        if (query == null || query.isBlank()) return List.of();

        String q = query.toLowerCase();

        return userRepository.findAll().stream()
                .filter(u -> u.getUserId() != null && !u.getUserId().equals(excludeUserId))
                .filter(u ->
                        (u.getName()  != null && u.getName().toLowerCase().contains(q)) ||
                                (u.getEmail() != null && u.getEmail().toLowerCase().contains(q))
                )
                .map(u -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id",      u.getUserId());
                    map.put("name",    u.getName() != null ? u.getName() : "User-" + u.getUserId());
                    map.put("email",   u.getEmail() != null ? u.getEmail() : "");
                    map.put("profile", u.getImage() != null ? u.getImage() : "");
                    return map;
                })
                .limit(10)
                .collect(Collectors.toList());
    }
}