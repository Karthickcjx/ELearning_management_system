package com.lms.dev.assessment.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lms.dev.assessment.entity.Assessment;
import com.lms.dev.course.entity.Course;
import com.lms.dev.user.entity.User;

public interface AssessmentRepository extends JpaRepository<Assessment, UUID> {

    List<Assessment> findByUserAndCourse(User user, Course course);

	List<Assessment> findByUser(User user);
}
