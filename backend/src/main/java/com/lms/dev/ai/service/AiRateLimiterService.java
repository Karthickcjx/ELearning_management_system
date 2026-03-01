package com.lms.dev.ai.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class AiRateLimiterService {

    private final ConcurrentHashMap<UUID, UserRateWindow> buckets = new ConcurrentHashMap<>();

    @Value("${app.ai.rate-limit.requests-per-minute:30}")
    private int requestsPerMinute;

    public boolean isAllowed(UUID userId) {
        long now = System.currentTimeMillis();
        UserRateWindow window = buckets.computeIfAbsent(userId, ignored -> new UserRateWindow(now));

        synchronized (window) {
            if (now - window.windowStartMs >= 60_000) {
                window.windowStartMs = now;
                window.counter.set(0);
            }
            return window.counter.incrementAndGet() <= requestsPerMinute;
        }
    }

    private static class UserRateWindow {
        private long windowStartMs;
        private final AtomicInteger counter;

        private UserRateWindow(long windowStartMs) {
            this.windowStartMs = windowStartMs;
            this.counter = new AtomicInteger(0);
        }
    }
}

