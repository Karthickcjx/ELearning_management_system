package com.lms.dev.ai.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
@EnableAsync
public class AiAsyncConfig {

    @Bean(name = "aiTaskExecutor")
    public TaskExecutor aiTaskExecutor(
            @Value("${app.ai.async.core-pool-size:16}") int corePoolSize,
            @Value("${app.ai.async.max-pool-size:64}") int maxPoolSize,
            @Value("${app.ai.async.queue-capacity:500}") int queueCapacity
    ) {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setThreadNamePrefix("ai-worker-");
        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(maxPoolSize);
        executor.setQueueCapacity(queueCapacity);
        executor.initialize();
        return executor;
    }
}

