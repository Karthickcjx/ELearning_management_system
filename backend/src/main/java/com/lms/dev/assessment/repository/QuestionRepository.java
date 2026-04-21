package com.lms.dev.assessment.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lms.dev.course.entity.Course;
import com.lms.dev.assessment.entity.Questions;

public interface QuestionRepository extends JpaRepository<Questions, UUID> {

	List<Questions> findByCourse(Course course); 
}
