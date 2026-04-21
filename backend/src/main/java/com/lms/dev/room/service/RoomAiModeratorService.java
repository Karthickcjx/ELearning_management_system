package com.lms.dev.room.service;

import com.lms.dev.chat.service.CohereService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoomAiModeratorService {

    @Value("${app.rooms.ai-moderator.enabled:true}")
    private boolean aiModeratorEnabled;

    private final CohereService cohereService;

    public String suggestHint(String topic, int skillBand, String prompt, List<String> recentMessages) {
        if (!aiModeratorEnabled) {
            return fallbackHint(topic, skillBand, prompt);
        }

        String instruction = buildInstruction(topic, skillBand, prompt, recentMessages);
        try {
            String response = cohereService.getChatResponse(instruction);
            if (response == null || response.isBlank()) {
                return fallbackHint(topic, skillBand, prompt);
            }
            String compact = response.trim().replaceAll("\\s+", " ");
            if (compact.length() > 500) {
                compact = compact.substring(0, 500);
            }
            return compact;
        } catch (Exception ex) {
            log.warn("AI moderator hint generation failed: {}", ex.getMessage());
            return fallbackHint(topic, skillBand, prompt);
        }
    }

    private String buildInstruction(String topic, int skillBand, String prompt, List<String> recentMessages) {
        StringBuilder builder = new StringBuilder();
        builder.append("You are an LMS collaborative room moderator. ");
        builder.append("Provide exactly one concise hint, not the final answer. ");
        builder.append("Tone: actionable and encouraging. Max 70 words. ");
        builder.append("Skill band (0 beginner -> 4 advanced): ").append(skillBand).append(". ");
        if (topic != null && !topic.isBlank()) {
            builder.append("Topic: ").append(topic).append(". ");
        }
        if (prompt != null && !prompt.isBlank()) {
            builder.append("Current problem: ").append(prompt.trim()).append(". ");
        }
        if (recentMessages != null && !recentMessages.isEmpty()) {
            builder.append("Recent student discussion: ");
            for (String message : recentMessages) {
                builder.append("[").append(message).append("] ");
            }
        }
        return builder.toString();
    }

    private String fallbackHint(String topic, int skillBand, String prompt) {
        String baseTopic = (topic == null || topic.isBlank()) ? "this problem" : topic;
        String normalizedPrompt = (prompt == null || prompt.isBlank()) ? "the problem statement" : prompt.trim();

        if (skillBand <= 1) {
            return "Start by listing what is given and what is asked in " + baseTopic
                    + ". Solve a tiny example first, then map each step back to " + normalizedPrompt + ".";
        }
        if (skillBand <= 3) {
            return "Break " + normalizedPrompt
                    + " into 2 sub-problems. Validate each assumption with one quick test case before combining your final approach.";
        }
        return "Focus on edge cases and complexity tradeoffs for " + normalizedPrompt
                + ". Compare at least two strategies and justify why your chosen one is robust.";
    }
}
