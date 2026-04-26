package com.lms.dev.course.service;

import com.lms.dev.course.entity.Course;
import com.lms.dev.course.repository.CourseRepository;
import com.lms.dev.review.repository.CourseRatingStatsProjection;
import com.lms.dev.review.repository.CourseReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final CourseReviewRepository courseReviewRepository;

    public List<Course> getAllCourses() {
        List<Course> courses = courseRepository.findAll();
        applyRatingSnapshots(courses);
        return courses;
    }

    public Course getCourseById(UUID id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        applyRatingSnapshot(course);
        return course;
    }

    public Course createCourse(Course course) {
        return courseRepository.save(course);
    }

    public Course updateCourse(UUID id, Course updatedCourse) {
        Course existing = courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        existing.setCourse_name(updatedCourse.getCourse_name());
        existing.setDescription(updatedCourse.getDescription());
        existing.setP_link(updatedCourse.getP_link());
        existing.setPrice(updatedCourse.getPrice());
        existing.setInstructor(updatedCourse.getInstructor());
        existing.setY_link(updatedCourse.getY_link());
        return courseRepository.save(existing);
    }

    public void deleteCourse(UUID id) {
        courseRepository.deleteById(id);
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

    private void applyRatingSnapshot(Course course) {
        if (courseReviewRepository == null) {
            return;
        }

        course.setAverageRating(roundRating(courseReviewRepository.findAverageRatingByCourseId(course.getCourse_id())));
        course.setReviewCount(courseReviewRepository.countByCourseId(course.getCourse_id()));
    }

    private double roundRating(Double rating) {
        if (rating == null) {
            return 0;
        }
        return Math.round(rating * 10.0) / 10.0;
    }
}
