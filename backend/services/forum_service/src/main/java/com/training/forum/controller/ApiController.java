package com.training.forum.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.training.forum.entity.Comment;
import com.training.forum.entity.Post;
import com.training.forum.entity.Reaction;
import com.training.forum.repository.CommentRepository;
import com.training.forum.repository.PostRepository;
import com.training.forum.repository.ReactionRepository;
import com.training.forum.service.UserServiceClient;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/forum/posts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Angular
public class ApiController {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final ReactionRepository reactionRepository;
    private final UserServiceClient userServiceClient;

    private final String uploadDir = System.getProperty("user.dir") + "/uploads/posts/";


    private static final Set<String> LOCAL_BAD_WORDS = Set.of(
            "fuck",
            "shit",
            "bitch",
            "asshole",
            "motherfucker",
            "bastard",
            "damn",
            "dick",
            "pussy",
            "slut",
            "whore"
    );

    private final RestTemplate restTemplate = new RestTemplate();

    private String censorBadWords(String text) {

        if (text == null || text.isBlank()) {
            return "";
        }

        String cleanText = text.trim();

        // ==================================================
        // 1️⃣ TRY EXTERNAL API
        // ==================================================
        try {

            String url =
                    "https://www.purgomalum.com/service/plain?fill_text=*&text="
                            + URLEncoder.encode(cleanText, StandardCharsets.UTF_8);

            String apiResult =
                    restTemplate.getForObject(url, String.class);

            if (apiResult != null && !apiResult.isBlank()) {
                return apiResult;
            }

        } catch (Exception ex) {

            System.out.println("Profanity API unavailable -> using local filter");
        }

        // ==================================================
        // 2️⃣ LOCAL FALLBACK FILTER
        // ==================================================
        return applyLocalProfanityFilter(cleanText);
    }

    private String applyLocalProfanityFilter(String text) {

        String result = text;

        for (String badWord : LOCAL_BAD_WORDS) {

            String regex =
                    "(?i)(?<![a-zA-Z0-9])"
                            + Pattern.quote(badWord)
                            + "(?![a-zA-Z0-9])";

            result = result.replaceAll(
                    regex,
                    maskWord(badWord.length())
            );
        }

        return result;
    }

    private String maskWord(int length) {

        return "*".repeat(Math.max(length, 4));
    }



    // ================================
    // 🔹 GET ALL POSTS
    // ================================
    @GetMapping
    public List<Map<String, Object>> getAllPosts(HttpServletRequest request) {
        String token = extractToken(request);
        List<Post> posts = postRepository.findAll();

        List<Map<String, Object>> response = new ArrayList<>();

        for (Post post : posts) {
            response.add(mapPost(post, token));
        }

        return response;
    }

    // ================================
    // 🔹 CREATE POST (IMAGE)
    // ================================
    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<?> createPost(
            @RequestParam Long userId,
            @RequestParam String title,
            @RequestParam String content,
            @RequestParam(required = false) MultipartFile image,
            HttpServletRequest request
    ) throws IOException {

        String imageUrl = null;

        if (image != null && !image.isEmpty()) {

            File dir = new File(uploadDir);

            if (!dir.exists()) {
                dir.mkdirs();
            }

            String fileName =
                    UUID.randomUUID()
                            + "_"
                            + image.getOriginalFilename();

            File file = new File(uploadDir + fileName);

            image.transferTo(file);

            imageUrl = fileName;
        }

        // 🔥 decode inputs first
        String cleanTitle =
                decodeInput(title);

        String cleanContent =
                decodeInput(content);

        // 🔥 then censor bad words
        cleanTitle =
                censorBadWords(cleanTitle);

        cleanContent =
                censorBadWords(cleanContent);

        Post post = new Post();

        post.setUserId(userId);
        post.setTitle(cleanTitle);
        post.setContent(cleanContent);
        post.setImageUrl(imageUrl);

        postRepository.save(post);

        String token = extractToken(request); // Fixed: pass the actual request
        return ResponseEntity.ok(
                mapPost(post, token)
        );
    }

    // ================================
    // 🔹 UPDATE POST
    // ================================
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePost(
            @PathVariable Long id,
            @RequestBody Post updatedPost,
            HttpServletRequest request
    ){

        return postRepository.findById(id)
                .map(post -> {

                    post.setTitle(
                            censorBadWords(updatedPost.getTitle())
                    );

                    post.setContent(
                            censorBadWords(updatedPost.getContent())
                    );

                    postRepository.save(post);

                    String token = extractToken(request);
                    return ResponseEntity.ok(mapPost(post, token));
                })
                .orElse(ResponseEntity.notFound().build());
    }


    // ================================
    // 🔹 DELETE POST
    // ================================
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id) {
        postRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // ================================
    // 🔹 TOGGLE REACTION (LIKE/UNLIKE)
    // ================================
    @PostMapping("/{postId}/react")
    public ResponseEntity<?> toggleReaction(
            @PathVariable Long postId,
            @RequestParam Long userId
    ) {

        Optional<Reaction> existing = reactionRepository.findByPostIdAndUserId(postId, userId);

        if (existing.isPresent()) {
            reactionRepository.delete(existing.get());
            return ResponseEntity.ok(Map.of("status", "removed"));
        }

        Post post = postRepository.findById(postId).orElseThrow();

        Reaction reaction = new Reaction();
        reaction.setUserId(userId);
        reaction.setPost(post);

        reactionRepository.save(reaction);

        return ResponseEntity.ok(Map.of("status", "added"));
    }

    // ================================
    // 🔹 ADD COMMENT
    // ================================
    @PostMapping("/{postId}/comments")
    public ResponseEntity<?> addComment(
            @PathVariable Long postId,
            @RequestParam Long userId,
            @RequestParam String content
    ) {

        Post post = postRepository.findById(postId).orElseThrow();

        Comment comment = new Comment();
        comment.setUserId(userId);
        comment.setContent(censorBadWords(content));

         comment.setPost(post);

        commentRepository.save(comment);

        return ResponseEntity.ok(comment);
    }

    // ================================
    // 🔹 UPDATE COMMENT
    // ================================
    @PutMapping("/comments/{id}")
    public ResponseEntity<?> updateComment(
            @PathVariable Long id,
            @RequestBody Comment updated
    ) {
        return commentRepository.findById(id)
                .map(comment -> {

                    comment.setContent(
                            censorBadWords(updated.getContent())
                    );

                    commentRepository.save(comment);

                    return ResponseEntity.ok(comment);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ================================
    // 🔹 DELETE COMMENT
    // ================================
    @DeleteMapping("/comments/{id}")
    public ResponseEntity<?> deleteComment(@PathVariable Long id) {
        commentRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // ================================
    // 🔹 HELPER (DTO MAP)
    // ================================
    private Map<String, Object> mapPost(Post post, String token) {
        Map<String, Object> map = new HashMap<>();

        map.put("id", post.getId());
        map.put("title", post.getTitle());
        map.put("content", post.getContent());
        map.put("imageUrl", post.getImageUrl());
        map.put("createdAt", post.getCreatedAt());
        map.put("userId", post.getUserId());

        // 🔥 Fetch Real User from UserServiceClient
        Map<String, Object> realUser = userServiceClient.getUserById(post.getUserId(), token);
        
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", post.getUserId());

        if (realUser != null) {
            // Map backend fields (firstName/lastName) to frontend fields (prenom/nom)
            userMap.put("nom", realUser.getOrDefault("lastName", ""));
            userMap.put("prenom", realUser.getOrDefault("firstName", ""));
            userMap.put("email", realUser.getOrDefault("email", ""));
            userMap.put("photo", realUser.getOrDefault("profileImageUrl", null));
        } else {
            // Fallback if user service is down or user not found
            userMap.put("nom", "Utilisateur");
            userMap.put("prenom", "User #" + post.getUserId());
            userMap.put("email", "unknown@certifypro.com");
            userMap.put("photo", null);
        }

        map.put("user", userMap);

        long reactionCount = reactionRepository.countByPostId(post.getId());
        map.put("reactionCount", reactionCount);

        List<Comment> commentList = commentRepository.findByPostId(post.getId());
        List<Map<String, Object>> comments = new ArrayList<>();

        for (Comment c : commentList) {
            Map<String, Object> cm = new HashMap<>();
            cm.put("id", c.getId());
            cm.put("content", c.getContent());
            cm.put("userId", c.getUserId());
            cm.put("date", c.getCommentDate());

            Map<String, Object> commentUser = new HashMap<>();
            commentUser.put("id", c.getUserId());
            commentUser.put("nom", "User");
            commentUser.put("prenom", String.valueOf(c.getUserId()));
            cm.put("user", commentUser);

            comments.add(cm);
        }

        map.put("comments", comments);
        map.put("commentCount", comments.size());

        return map;
    }








    @PostMapping("/translate")
    public ResponseEntity<?> translate(
            @RequestBody Map<String,String> body
    ) {

        try {

            String title = body.getOrDefault("title", "");
            String content = body.getOrDefault("content", "");
            String from = body.getOrDefault("from", "auto");
            String to = body.getOrDefault("to", "en");

            String translatedTitle = translateText(title, from, to);
            String translatedContent = translateText(content, from, to);

            return ResponseEntity.ok(
                    Map.of(
                            "title", translatedTitle,
                            "content", translatedContent,
                            "success", true
                    )
            );

        } catch (Exception e) {

            return ResponseEntity.ok(
                    Map.of(
                            "title", body.get("title"),
                            "content", body.get("content"),
                            "success", false
                    )
            );
        }
    }

    private String translateText(String text, String from, String to) {

        if (text == null || text.trim().isEmpty()) {
            return "";
        }

        try {

            String encoded =
                    URLEncoder.encode(text, StandardCharsets.UTF_8);

            String url =
                    "https://api.mymemory.translated.net/get?q="
                            + encoded
                            + "&langpair="
                            + from + "|" + to;

            RestTemplate rest = new RestTemplate();

            Map response = rest.getForObject(url, Map.class);

            if (response == null) return text;

            Map data = (Map) response.get("responseData");

            if (data == null) return text;

            Object translatedObj = data.get("translatedText");

            if (translatedObj == null) return text;

            String translated = translatedObj.toString();

            // 🔥 decode %27 etc
            translated = URLDecoder.decode(
                    translated,
                    StandardCharsets.UTF_8
            );

            return translated;

        } catch (Exception e) {
            e.printStackTrace();
            return text;
        }
    }






    @PostMapping("/ai-generate")
    public ResponseEntity<?> generateAiPost(
            @RequestBody Map<String, String> body
    ) {

        try {

            String prompt = body.getOrDefault("prompt", "").trim();

            if (prompt.isEmpty()) {
                return ResponseEntity.ok(
                        Map.of(
                                "title", "Prompt vide",
                                "content", "Veuillez décrire votre idée."
                        )
                );
            }

            String apiKey = "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";

            // ==================================================
            // HEADERS
            // ==================================================
            MultiValueMap<String, String> headers =
                    new LinkedMultiValueMap<>();

            headers.add("Content-Type", "application/json");
            headers.add("Authorization", "Bearer " + apiKey);
            headers.add("HTTP-Referer", "http://localhost:4200");
            headers.add("X-Title", "Forum AI Generator");

            // ==================================================
            // PROMPT
            // ==================================================
            String aiPrompt =
                    """
                    Generate one engaging forum/social media post but with english!without point exclamation or interogation or emojies .
    
                    Return ONLY valid JSON.
    
                    Format:
                    {
                      "title":"short catchy title",
                      "content":"clean professional post without emojis and lenght 20 words"
                    }
    
                    No markdown.
                    No explanation.
                    No code block.
    
                    Topic:
                    """ + prompt;

            Map<String, Object> req = new HashMap<>();

            req.put("model", "openai/gpt-4o-mini");

            req.put(
                    "messages",
                    List.of(
                            Map.of(
                                    "role", "user",
                                    "content", aiPrompt
                            )
                    )
            );

            req.put("temperature", 0.8);
            req.put("max_tokens", 500);

            HttpEntity<Map<String, Object>> entity =
                    new HttpEntity<>(req, headers);

            // ==================================================
            // CALL OPENROUTER
            // ==================================================
            RestTemplate rest = new RestTemplate();

            ResponseEntity<Map> response =
                    rest.postForEntity(
                            "https://openrouter.ai/api/v1/chat/completions",
                            entity,
                            Map.class
                    );

            if (response.getBody() == null) {

                return ResponseEntity.ok(
                        Map.of(
                                "title", "Erreur",
                                "content", "Réponse vide de l'IA."
                        )
                );
            }

            List<Map<String, Object>> choices =
                    (List<Map<String, Object>>) response
                            .getBody()
                            .get("choices");

            if (choices == null || choices.isEmpty()) {

                return ResponseEntity.ok(
                        Map.of(
                                "title", "Erreur",
                                "content", "Aucune suggestion trouvée."
                        )
                );
            }

            Map<String, Object> firstChoice = choices.get(0);

            Map<String, Object> message =
                    (Map<String, Object>) firstChoice.get("message");

            if (message == null) {

                return ResponseEntity.ok(
                        Map.of(
                                "title", "Erreur",
                                "content", "Message IA invalide."
                        )
                );
            }

            String raw =
                    message.get("content")
                            .toString()
                            .replace("```json", "")
                            .replace("```", "")
                            .trim();
            raw = URLDecoder.decode(
                    raw,
                    StandardCharsets.UTF_8
            );

            // ==================================================
            // PARSE JSON
            // ==================================================
            ObjectMapper mapper = new ObjectMapper();

            try {

                Map<String, String> parsed =
                        mapper.readValue(raw, Map.class);

                String title =
                        parsed.getOrDefault(
                                "title",
                                "AI Generated Post"
                        );

                String content =
                        parsed.getOrDefault(
                                "content",
                                raw
                        );

                return ResponseEntity.ok(
                        Map.of(
                                "title", title,
                                "content", content
                        )
                );

            } catch (Exception ex) {

                // fallback if AI returns text only
                return ResponseEntity.ok(
                        Map.of(
                                "title", "AI Generated Post",
                                "content", raw
                        )
                );
            }

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity.ok(
                    Map.of(
                            "title", "Erreur IA",
                            "content", "Impossible de générer le post."
                    )
            );
        }
    }


    private String decodeInput(String text) {

        if (text == null || text.isBlank()) {
            return "";
        }

        try {

            String result = text.trim();

            // decode multiple times
            for (int i = 0; i < 5; i++) {

                String decoded =
                        URLDecoder.decode(
                                result,
                                StandardCharsets.UTF_8
                        );

                if (decoded.equals(result)) {
                    break;
                }

                result = decoded;
            }

            result = result
                    .replace("+", " ")
                    .replace("\\n", "\n")
                    .replace("\\t", "\t")
                    .trim();

            return result;

        } catch (Exception e) {
            return text;
        }
    }

    private String extractToken(HttpServletRequest request) {
        if (request == null) return null;
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }
}