package com.esprit.pi.messangingservice.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

/**
 * Configuration WebSocket STOMP — inchangée.
 *
 * Endpoint   : ws://localhost:8085/ws-chat
 * Subscribe  : /topic/room/{chatRoomId}
 *              /topic/room/{chatRoomId}/typing
 *              /topic/users.status
 * Send       : /app/chat.send
 *              /app/chat.connect
 *              /app/chat.disconnect
 *              /app/chat.typing
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-chat")
                .setAllowedOriginPatterns("*");
        // .withSockJS()  ← décommentez si nécessaire
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app");
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setUserDestinationPrefix("/user");
    }
}