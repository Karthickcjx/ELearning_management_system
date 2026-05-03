package com.lms.dev.progress.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lms.dev.course.entity.Course;
import com.lms.dev.progress.entity.Progress;
import com.lms.dev.user.entity.User;

import java.util.List;
import java.util.UUID;

public interface ProgressRepository extends JpaRepository<Progress, UUID> {

	Progress findByUserAndCourse(User user, Course course);

    List<Progress> findByUser(User user);
}
