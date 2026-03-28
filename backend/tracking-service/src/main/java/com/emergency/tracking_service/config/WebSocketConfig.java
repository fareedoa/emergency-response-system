package com.emergency.tracking_service.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Use /topic prefix for outgoing WebSocket communication
        config.enableSimpleBroker("/topic");
        // Prefix for messages BOUND for methods annotated with @MessageMapping
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Plain WebSocket endpoint — no SockJS wrapper.
        // Frontend connects to: ws://localhost:8083/ws-tracking/websocket
        registry.addEndpoint("/ws-tracking/websocket").setAllowedOriginPatterns("*").withSockJS();;
    }
}
