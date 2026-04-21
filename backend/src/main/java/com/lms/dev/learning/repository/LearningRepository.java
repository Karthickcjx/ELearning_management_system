package com.lms.dev.learning.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lms.dev.course.entity.Course;
import com.lms.dev.learning.entity.Learning;
import com.lms.dev.user.entity.User;

import java.util.UUID;

public interface LearningRepository extends JpaRepository<Learning, UUID> {

	Learning findByUserAndCourse(User user, Course course);

    boolean existsByIdAndUser_Id(UUID id, UUID userId);
}
