package com.lms.dev.ai.repository;

import com.lms.dev.ai.entity.AiRecommendation;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface AiRecommendationRepository extends JpaRepository<AiRecommendation, Long> {

    @Query("""
            select r from AiRecommendation r
            where r.user.id = :userId
              and r.expiresAt > :now
              and (:courseId is null or r.course.course_id = :courseId)
            order by r.score desc, r.createdAt desc
            """)
    List<AiRecommendation> findActiveRecommendations(
            @Param("userId") UUID userId,
            @Param("courseId") UUID courseId,
            @Param("now") LocalDateTime now,
            Pageable pageable
    );
}

