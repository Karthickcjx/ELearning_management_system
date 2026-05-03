package com.lms.dev.ai.service;

import com.lms.dev.ai.dto.AiRecommendationResponse;
import com.lms.dev.ai.entity.AiRecommendation;
import com.lms.dev.ai.repository.AiRecommendationRepository;
import com.lms.dev.course.entity.Course;
import com.lms.dev.progress.entity.Progress;
import com.lms.dev.user.entity.User;
import com.lms.dev.course.repository.CourseRepository;
import com.lms.dev.progress.repository.ProgressRepository;
import com.lms.dev.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiRecommendationService {

    private final AiRecommendationRepository recommendationRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final ProgressRepository progressRepository;

    @Value("${app.ai.model-version:gemini-3-flash-preview}")
    private String modelVersion;

    @Transactional
    public List<AiRecommendationResponse> getRecommendations(UUID userId, UUID preferredCourseId) {
        LocalDateTime now = LocalDateTime.now();
        List<AiRecommendation> cached = recommendationRepository.findActiveRecommendations(
                userId,
                preferredCourseId,
                now,
                PageRequest.of(0, 5)
        );

        if (!cached.isEmpty()) {
            return cached.stream().map(this::toResponse).toList();
        }

        List<AiRecommendation> generated = generateAndPersist(userId, preferredCourseId, now);
        return generated.stream().map(this::toResponse).toList();
    }

    private List<AiRecommendation> generateAndPersist(UUID userId, UUID preferredCourseId, LocalDateTime now) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<Course> candidateCourses = resolveCourses(preferredCourseId);
        if (candidateCourses.isEmpty()) {
            return List.of();
        }

        Map<UUID, Progress> progressByCourseId = progressRepository.findByUser(user).stream()
                .collect(Collectors.toMap(
                        p -> p.getCourse().getCourse_id(),
                        Function.identity(),
                        (left, right) -> right
                ));

        List<AiRecommendation> recommendations = new ArrayList<>();
        for (Course course : candidateCourses) {
            Progress progress = progressByCourseId.get(course.getCourse_id());
            double completionRatio = completionRatio(progress);

            double rawScore = 1.0 - completionRatio;
            if (preferredCourseId != null && preferredCourseId.equals(course.getCourse_id())) {
                rawScore = Math.min(1.0, rawScore + 0.15);
            }

            BigDecimal score = BigDecimal.valueOf(rawScore).setScale(4, RoundingMode.HALF_UP);
            recommendations.add(AiRecommendation.builder()
                    .user(user)
                    .course(course)
                    .score(score)
                    .reason(buildReason(course.getCourse_name(), completionRatio))
                    .modelVersion(modelVersion)
                    .createdAt(now)
                    .expiresAt(now.plusMinutes(15))
                    .build());
        }

        recommendations.sort(Comparator.comparing(AiRecommendation::getScore).reversed());
        List<AiRecommendation> top = recommendations.stream().limit(5).toList();
        return recommendationRepository.saveAll(top);
    }

    private List<Course> resolveCourses(UUID preferredCourseId) {
        if (preferredCourseId == null) {
            return courseRepository.findAll();
        }
        return courseRepository.findById(preferredCourseId)
                .map(List::of)
                .orElse(List.of());
    }

    private double completionRatio(Progress progress) {
        if (progress == null || progress.getDuration() <= 0) {
            return 0.0;
        }
        double ratio = progress.getPlayedTime() / progress.getDuration();
        return Math.max(0.0, Math.min(1.0, ratio));
    }

    private String buildReason(String courseName, double completionRatio) {
        if (completionRatio == 0.0) {
            return "You have not started " + safe(courseName) + " yet. Start now for quick progress.";
        }
        if (completionRatio < 0.5) {
            return "You are in progress on " + safe(courseName) + ". Continue to improve retention.";
        }
        if (completionRatio < 1.0) {
            return "You are close to completing " + safe(courseName) + ". Finish now to unlock certificate value.";
        }
        return "You completed " + safe(courseName) + ". Revisit key lessons for stronger fundamentals.";
    }

    private String safe(String value) {
        return value == null ? "this course" : value;
    }

    private AiRecommendationResponse toResponse(AiRecommendation recommendation) {
        return AiRecommendationResponse.builder()
                .id(recommendation.getId())
                .courseId(recommendation.getCourse().getCourse_id())
                .courseName(recommendation.getCourse().getCourse_name())
                .lessonId(recommendation.getLessonId())
                .score(recommendation.getScore())
                .reason(recommendation.getReason())
                .modelVersion(recommendation.getModelVersion())
                .expiresAt(recommendation.getExpiresAt())
                .build();
    }
}

