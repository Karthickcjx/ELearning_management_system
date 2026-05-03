package com.lms.dev.learning.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.lms.dev.course.dto.EnrollRequest;
import com.lms.dev.course.entity.Course;
import com.lms.dev.learning.entity.Learning;
import com.lms.dev.progress.entity.Progress;
import com.lms.dev.review.repository.CourseRatingStatsProjection;
import com.lms.dev.review.repository.CourseReviewRepository;
import com.lms.dev.user.entity.User;
import com.lms.dev.course.repository.CourseRepository;
import com.lms.dev.learning.repository.LearningRepository;
import com.lms.dev.progress.repository.ProgressRepository;
import com.lms.dev.user.repository.UserRepository;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class LearningService {

    private final LearningRepository learningRepository;

    private final UserRepository userRepository;

    private final CourseRepository courseRepository;

    private final ProgressRepository progressRepository;

    private final CourseReviewRepository courseReviewRepository;

    public List<Course> getLearningCourses(UUID userId) {
        Optional<User> optionalUser = userRepository.findById(userId);

        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            List<Course> learningCourses = new ArrayList<>();

            for (Learning learning : user.getLearningCourses()) {
                Course course = learning.getCourse();
                learningCourses.add(course);
            }

            applyRatingSnapshots(learningCourses);
            return learningCourses;
        }

        return Collections.emptyList();
    }

    public List<com.lms.dev.learning.dto.LearningResponse> getEnrollments() {
        return learningRepository.findAll().stream()
                .map(learning -> com.lms.dev.learning.dto.LearningResponse.builder()
                        .id(learning.getId())
                        .userId(learning.getUser().getId())
                        .courseId(learning.getCourse().getCourse_id())
                        .courseName(learning.getCourse().getCourse_name())
                        .build())
                .collect(java.util.stream.Collectors.toList());
    }

    public String enrollCourse(EnrollRequest enrollRequest) {
        User user = userRepository.findById(enrollRequest.getUserId()).orElse(null);
        Course course = courseRepository.findById(enrollRequest.getCourseId()).orElse(null);

        if (user != null && course != null) {
            Learning existingLearning = learningRepository.findByUserAndCourse(user, course);
            if (existingLearning != null) {
                return "Course already enrolled";
            }

            Progress progress = new Progress();
            progress.setUser(user);
            progress.setCourse(course);
            progressRepository.save(progress);

            Learning learning = new Learning();
            learning.setUser(user);
            learning.setCourse(course);
            learningRepository.save(learning);

            return "Enrolled successfully";
        }

        return "Failed to enroll";
    }

    public void unenrollCourse(UUID id) {
        learningRepository.deleteById(id);
    }

    public boolean isEnrollmentOwnedByUser(UUID enrollmentId, UUID userId) {
        return learningRepository.existsByIdAndUser_Id(enrollmentId, userId);
    }

    private void applyRatingSnapshots(List<Course> courses) {
        if (courseReviewRepository == null) {
            return;
        }

        Map<UUID, CourseRatingStatsProjection> statsByCourseId = courseReviewRepository.findRatingStatsByCourse()
                .stream()
                .collect(Collectors.toMap(CourseRatingStatsProjection::getCourseId, Function.identity()));

        for (Course course : courses) {
            CourseRatingStatsProjection stats = statsByCourseId.get(course.getCourse_id());
            course.setAverageRating(stats == null ? 0 : roundRating(stats.getAverageRating()));
            course.setReviewCount(stats == null || stats.getReviewCount() == null ? 0 : stats.getReviewCount());
        }
    }

    private double roundRating(Double rating) {
        if (rating == null) {
            return 0;
        }
        return Math.round(rating * 10.0) / 10.0;
    }
}
