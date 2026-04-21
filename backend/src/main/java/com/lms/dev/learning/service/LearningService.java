package com.lms.dev.learning.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.lms.dev.course.dto.EnrollRequest;
import com.lms.dev.course.entity.Course;
import com.lms.dev.learning.entity.Learning;
import com.lms.dev.progress.entity.Progress;
import com.lms.dev.user.entity.User;
import com.lms.dev.course.repository.CourseRepository;
import com.lms.dev.learning.repository.LearningRepository;
import com.lms.dev.progress.repository.ProgressRepository;
import com.lms.dev.user.repository.UserRepository;
import java.util.*;

@RequiredArgsConstructor
@Service
public class LearningService {

    private final LearningRepository learningRepository;

    private final UserRepository userRepository;

    private final CourseRepository courseRepository;

    private final ProgressRepository progressRepository;

    public List<Course> getLearningCourses(UUID userId) {
        Optional<User> optionalUser = userRepository.findById(userId);

        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            List<Course> learningCourses = new ArrayList<>();

            for (Learning learning : user.getLearningCourses()) {
                Course course = learning.getCourse();
                learningCourses.add(course);
            }

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
}
