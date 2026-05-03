package com.lms.dev.progress.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.lms.dev.progress.dto.ProgressRequest;
import com.lms.dev.progress.dto.ProgressResponse;
import com.lms.dev.course.entity.Course;
import com.lms.dev.progress.entity.Progress;
import com.lms.dev.user.entity.User;
import com.lms.dev.course.repository.CourseRepository;
import com.lms.dev.progress.repository.ProgressRepository;
import com.lms.dev.user.repository.UserRepository;

import java.util.UUID;

@RequiredArgsConstructor
@Service
public class ProgressService {

    public static final int CERTIFICATE_UNLOCK_PERCENT = 85;

    private final ProgressRepository progressRepository;

    private final UserRepository userRepository;

    private final CourseRepository courseRepository;

    public ResponseEntity<String> updateProgress(ProgressRequest request) {
        UUID userId = request.getUserId();
        UUID courseId = request.getCourseId();
        float playedTime = request.getPlayedTime();
        float duration = request.getDuration();

        User user = userRepository.findById(userId).orElse(null);
        Course course = courseRepository.findById(courseId).orElse(null);

        if (user != null && course != null) {
            Progress progress = progressRepository.findByUserAndCourse(user, course);
            if (progress != null && (progress.getPlayedTime() == 0 || progress.getPlayedTime()<= playedTime)) {
                progress.setPlayedTime(playedTime);
                progress.setDuration(duration);
                refreshCompletionState(progress);
                progressRepository.save(progress);
                return ResponseEntity.ok("success");
            } else {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Invalid playedTime");
            }
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User or course not found");
    }

	public float getProgress(UUID userId, UUID courseId) {
		User user = userRepository.findById(userId).orElse(null);
        Course course = courseRepository.findById(courseId).orElse(null);

        if (user != null && course != null) {
         Progress progress = progressRepository.findByUserAndCourse(user, course);
         if (progress != null) {
             return progress.getPlayedTime();
         }
        }
		return 0; 
	}

    public ProgressResponse getProgressSummary(UUID userId, UUID courseId) {
        User user = userRepository.findById(userId).orElse(null);
        Course course = courseRepository.findById(courseId).orElse(null);

        if (user != null && course != null) {
            Progress progress = progressRepository.findByUserAndCourse(user, course);

            if (progress != null) {
                float playedTime = progress.getPlayedTime();
                float duration = progress.getDuration();
                return buildProgressResponse(userId, courseId, playedTime, duration);
            }
        }

        return buildProgressResponse(userId, courseId, 0, 0);
    }

	public ResponseEntity<String> updateDuration(ProgressRequest request) {
        UUID userId = request.getUserId();
        UUID courseId = request.getCourseId();
        float newDuration = request.getDuration();

        User user = userRepository.findById(userId).orElse(null);
        Course course = courseRepository.findById(courseId).orElse(null);

        if (user != null && course != null) {
            Progress progress = progressRepository.findByUserAndCourse(user, course);

            if (progress != null) {
                progress.setDuration(newDuration);
                refreshCompletionState(progress);
                progressRepository.save(progress);

                return ResponseEntity.ok("Duration updated successfully");
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Progress not found for the given user and course");
            }
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User or course not found");
        }
    }

    private ProgressResponse buildProgressResponse(UUID userId, UUID courseId, float playedTime, float duration) {
        int progressPercent = calculateProgressPercent(playedTime, duration);

        return ProgressResponse.builder()
                .userId(userId)
                .courseId(courseId)
                .playedTime(playedTime)
                .duration(duration)
                .progressPercent(progressPercent)
                .completed(progressPercent >= 100)
                .certificateEligible(progressPercent >= CERTIFICATE_UNLOCK_PERCENT)
                .certificateUnlockPercent(CERTIFICATE_UNLOCK_PERCENT)
                .remainingPercentToCertificate(Math.max(CERTIFICATE_UNLOCK_PERCENT - progressPercent, 0))
                .build();
    }

    private int calculateProgressPercent(float playedTime, float duration) {
        if (duration <= 0) {
            return 0;
        }

        return Math.min(100, Math.round((playedTime / duration) * 100));
    }

    private void refreshCompletionState(Progress progress) {
        int progressPercent = calculateProgressPercent(progress.getPlayedTime(), progress.getDuration());
        progress.setCompletionPercentage(progressPercent);
        progress.setCompleted(progressPercent >= 100);
    }
}
