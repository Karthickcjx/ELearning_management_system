package com.lms.dev.ai.config;

import com.lms.dev.ai.security.JwtChannelInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Arrays;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class AiWebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${app.ai.websocket.allowed-origins:http://localhost:3000,http://127.0.0.1:3000}")
    private String aiAllowedOrigins;

    @Value("${app.rooms.websocket.allowed-origins:http://localhost:3000,http://127.0.0.1:3000}")
    private String roomAllowedOrigins;

    private final JwtChannelInterceptor jwtChannelInterceptor;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-ai")
                .setAllowedOriginPatterns(resolveAllowedOrigins(aiAllowedOrigins));

        registry.addEndpoint("/ws-room")
                .setAllowedOriginPatterns(resolveAllowedOrigins(roomAllowedOrigins));
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(jwtChannelInterceptor);
    }

    private String[] resolveAllowedOrigins(String allowedOrigins) {
        return Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toArray(String[]::new);
    }
}
