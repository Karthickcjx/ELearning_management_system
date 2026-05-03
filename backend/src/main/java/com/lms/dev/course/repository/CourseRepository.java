package com.lms.dev.course.repository;
import org.springframework.data.jpa.repository.JpaRepository;

import com.lms.dev.course.entity.Course;

import java.util.UUID;


public interface CourseRepository extends JpaRepository<Course, UUID> {
}
