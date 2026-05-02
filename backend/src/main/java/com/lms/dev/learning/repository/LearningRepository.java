package com.lms.dev.learning.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lms.dev.course.entity.Course;
import com.lms.dev.learning.entity.Learning;
import com.lms.dev.user.entity.User;

import java.util.UUID;

public interface LearningRepository extends JpaRepository<Learning, UUID> {

	Learning findByUserAndCourse(User user, Course course);

    boolean existsByIdAndUser_Id(UUID id, UUID userId);

    @Query("""
            select count(learning) > 0
            from Learning learning
            where learning.user.id = :userId
              and learning.course.course_id = :courseId
            """)
    boolean existsByUserIdAndCourseId(@Param("userId") UUID userId, @Param("courseId") UUID courseId);
}
