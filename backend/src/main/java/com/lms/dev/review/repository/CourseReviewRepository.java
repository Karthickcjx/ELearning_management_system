package com.lms.dev.review.repository;

import com.lms.dev.review.entity.CourseReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CourseReviewRepository extends JpaRepository<CourseReview, UUID> {

    @Query("select r from CourseReview r where r.user.id = :userId and r.course.course_id = :courseId")
    Optional<CourseReview> findByUserIdAndCourseId(@Param("userId") UUID userId, @Param("courseId") UUID courseId);

    @Query("""
            select case when count(r) > 0 then true else false end
            from CourseReview r
            where r.user.id = :userId and r.course.course_id = :courseId
            """)
    boolean existsByUserIdAndCourseId(@Param("userId") UUID userId, @Param("courseId") UUID courseId);

    @Query("select r from CourseReview r where r.course.course_id = :courseId")
    Page<CourseReview> findByCourseId(@Param("courseId") UUID courseId, Pageable pageable);

    @Query("select count(r) from CourseReview r where r.course.course_id = :courseId")
    long countByCourseId(@Param("courseId") UUID courseId);

    @Query("select coalesce(avg(r.rating), 0) from CourseReview r where r.course.course_id = :courseId")
    Double findAverageRatingByCourseId(@Param("courseId") UUID courseId);

    @Query("""
            select r.course.course_id as courseId,
                   avg(r.rating) as averageRating,
                   count(r.id) as reviewCount
            from CourseReview r
            group by r.course.course_id
            """)
    List<CourseRatingStatsProjection> findRatingStatsByCourse();

    @Query("""
            select r.rating as rating, count(r.id) as total
            from CourseReview r
            where r.course.course_id = :courseId
            group by r.rating
            """)
    List<RatingDistributionProjection> findRatingDistribution(@Param("courseId") UUID courseId);

    @Query("""
            select r
            from CourseReview r
            where (:rating is null or r.rating = :rating)
              and (
                  :search is null
                  or lower(r.user.username) like lower(concat('%', :search, '%'))
                  or lower(r.user.email) like lower(concat('%', :search, '%'))
                  or lower(r.course.course_name) like lower(concat('%', :search, '%'))
              )
            """)
    Page<CourseReview> searchAdminReviews(
            @Param("search") String search,
            @Param("rating") Integer rating,
            Pageable pageable
    );

    interface RatingDistributionProjection {
        Integer getRating();

        Long getTotal();
    }
}
