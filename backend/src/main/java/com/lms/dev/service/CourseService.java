package com.lms.dev.service;

import com.lms.dev.entity.Course;
import com.lms.dev.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class CourseService {

    private final CourseRepository courseRepository;

    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    public Course getCourseById(UUID id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
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
}
