package com.lms.dev.review.service;

import com.lms.dev.course.entity.Course;
import com.lms.dev.course.repository.CourseRepository;
import com.lms.dev.learning.repository.LearningRepository;
import com.lms.dev.progress.entity.Progress;
import com.lms.dev.progress.repository.ProgressRepository;
import com.lms.dev.review.dto.CourseRatingSummaryResponse;
import com.lms.dev.review.dto.ReviewEligibilityResponse;
import com.lms.dev.review.dto.ReviewRequest;
import com.lms.dev.review.dto.ReviewResponse;
import com.lms.dev.review.entity.CourseReview;
import com.lms.dev.review.repository.CourseReviewRepository;
import com.lms.dev.user.entity.User;
import com.lms.dev.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    public static final int REVIEW_UNLOCK_PERCENT = 85;
    private static final int MAX_REVIEW_TEXT_LENGTH = 500;
    private static final Pattern HTML_TAG_PATTERN = Pattern.compile("<[^>]*>");
    private static final Pattern CONTROL_CHARS_PATTERN = Pattern.compile("[\\p{Cntrl}&&[^\r\n\t]]");
    private static final Pattern REPEATED_CHAR_PATTERN = Pattern.compile("(.)\\1{8,}", Pattern.CASE_INSENSITIVE);
    private static final Pattern REPEATED_WORD_PATTERN = Pattern.compile("\\b(\\w+)\\b(?:\\s+\\1\\b){4,}", Pattern.CASE_INSENSITIVE);

    private final CourseReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final LearningRepository learningRepository;
    private final ProgressRepository progressRepository;

    @Transactional
    public ReviewResponse createReview(UUID userId, ReviewRequest request) {
        User user = getUser(userId);
        Course course = getCourse(request.getCourseId());
        validateCanReview(user, course);

        if (reviewRepository.existsByUserIdAndCourseId(userId, course.getCourse_id())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already reviewed this course");
        }

        CourseReview review = new CourseReview();
        review.setUser(user);
        review.setCourse(course);
        applyReviewFields(review, request);

        return ReviewResponse.from(reviewRepository.save(review));
    }

    @Transactional
    public ReviewResponse updateReview(UUID reviewId, UUID currentUserId, ReviewRequest request) {
        CourseReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));

        if (!review.getUser().getId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the review owner can edit this review");
        }

        UUID requestedCourseId = request.getCourseId();
        if (requestedCourseId != null && !requestedCourseId.equals(review.getCourse().getCourse_id())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Review course cannot be changed");
        }

        validateCanReview(review.getUser(), review.getCourse());
        applyReviewFields(review, request);
        return ReviewResponse.from(reviewRepository.save(review));
    }

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getCourseReviews(UUID courseId, int page, int size, String sort) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found");
        }

        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.max(1, Math.min(size, 25)),
                resolveSort(sort)
        );

        return reviewRepository.findByCourseId(courseId, pageable)
                .map(ReviewResponse::from);
    }

    @Transactional(readOnly = true)
    public ReviewEligibilityResponse getMyReviewStatus(UUID userId, UUID courseId) {
        User user = getUser(userId);
        Course course = getCourse(courseId);
        return buildEligibilityResponse(user, course);
    }

    @Transactional(readOnly = true)
    public List<ReviewEligibilityResponse> getPendingReviewPrompts(UUID userId) {
        User user = getUser(userId);
        List<Progress> progressRows = progressRepository.findByUser(user);

        return progressRows.stream()
                .filter(progress -> progress.getCourse() != null)
                .filter(progress -> learningRepository.findByUserAndCourse(user, progress.getCourse()) != null)
                .filter(progress -> calculateProgressPercent(progress) >= REVIEW_UNLOCK_PERCENT)
                .filter(progress -> !reviewRepository.existsByUserIdAndCourseId(userId, progress.getCourse().getCourse_id()))
                .map(progress -> buildEligibilityResponse(user, progress.getCourse()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CourseRatingSummaryResponse getCourseRatingSummary(UUID courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found");
        }

        Map<Integer, Long> distribution = new LinkedHashMap<>();
        for (int rating = 5; rating >= 1; rating--) {
            distribution.put(rating, 0L);
        }

        for (CourseReviewRepository.RatingDistributionProjection row : reviewRepository.findRatingDistribution(courseId)) {
            distribution.put(row.getRating(), row.getTotal());
        }

        return CourseRatingSummaryResponse.builder()
                .courseId(courseId)
                .averageRating(roundRating(reviewRepository.findAverageRatingByCourseId(courseId)))
                .reviewCount(reviewRepository.countByCourseId(courseId))
                .ratingDistribution(distribution)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getAdminReviews(String search, Integer rating, int page, int size) {
        Integer normalizedRating = rating != null && rating >= 1 && rating <= 5 ? rating : null;
        String normalizedSearch = search == null || search.trim().isEmpty() ? null : search.trim();
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.max(1, Math.min(size, 50)),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        return reviewRepository.searchAdminReviews(normalizedSearch, normalizedRating, pageable)
                .map(ReviewResponse::from);
    }

    @Transactional
    public void deleteReview(UUID reviewId) {
        if (!reviewRepository.existsById(reviewId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found");
        }
        reviewRepository.deleteById(reviewId);
    }

    private void applyReviewFields(CourseReview review, ReviewRequest request) {
        Integer rating = request.getRating();
        if (rating == null || rating < 1 || rating > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rating must be between 1 and 5");
        }

        String sanitizedText = sanitizeReviewText(request.getReviewText());
        validateSpamText(sanitizedText);

        review.setRating(rating);
        review.setReviewText(sanitizedText);
    }

    private void validateCanReview(User user, Course course) {
        if (learningRepository.findByUserAndCourse(user, course) == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You must be enrolled in this course to review it");
        }

        Progress progress = progressRepository.findByUserAndCourse(user, course);
        int progressPercent = calculateProgressPercent(progress);
        if (progressPercent < REVIEW_UNLOCK_PERCENT) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Complete at least 85% of the course before reviewing");
        }
    }

    private ReviewEligibilityResponse buildEligibilityResponse(User user, Course course) {
        boolean enrolled = learningRepository.findByUserAndCourse(user, course) != null;
        Progress progress = progressRepository.findByUserAndCourse(user, course);
        int progressPercent = calculateProgressPercent(progress);
        Optional<CourseReview> review = reviewRepository.findByUserIdAndCourseId(user.getId(), course.getCourse_id());
        boolean eligible = enrolled && progressPercent >= REVIEW_UNLOCK_PERCENT;

        String message;
        if (!enrolled) {
            message = "Enroll in this course before reviewing";
        } else if (progressPercent < REVIEW_UNLOCK_PERCENT) {
            message = "Complete at least 85% of the course before reviewing";
        } else if (review.isPresent()) {
            message = "You already reviewed this course";
        } else {
            message = "You can review this course";
        }

        return ReviewEligibilityResponse.builder()
                .courseId(course.getCourse_id())
                .courseName(course.getCourse_name())
                .eligible(eligible)
                .enrolled(enrolled)
                .hasReview(review.isPresent())
                .progressPercent(progressPercent)
                .message(message)
                .review(review.map(ReviewResponse::from).orElse(null))
                .build();
    }

    private int calculateProgressPercent(Progress progress) {
        if (progress == null) {
            return 0;
        }

        float duration = progress.getDuration();
        float playedTime = progress.getPlayedTime();

        if (duration > 0) {
            return Math.min(100, Math.max(0, Math.round((playedTime / duration) * 100)));
        }

        if (playedTime >= 0 && playedTime <= 100) {
            return Math.round(playedTime);
        }

        return 0;
    }

    private String sanitizeReviewText(String text) {
        if (text == null) {
            return "";
        }

        String sanitized = HTML_TAG_PATTERN.matcher(text).replaceAll("");
        sanitized = CONTROL_CHARS_PATTERN.matcher(sanitized).replaceAll("");
        sanitized = sanitized.replace("&nbsp;", " ").trim();

        if (sanitized.length() > MAX_REVIEW_TEXT_LENGTH) {
            sanitized = sanitized.substring(0, MAX_REVIEW_TEXT_LENGTH).trim();
        }

        return sanitized;
    }

    private void validateSpamText(String text) {
        if (text == null || text.isBlank()) {
            return;
        }

        if (REPEATED_CHAR_PATTERN.matcher(text).find() || REPEATED_WORD_PATTERN.matcher(text).find()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Review text appears to be spam");
        }
    }

    private Sort resolveSort(String sort) {
        if ("highest".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Direction.DESC, "rating").and(Sort.by(Sort.Direction.DESC, "createdAt"));
        }
        if ("lowest".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Direction.ASC, "rating").and(Sort.by(Sort.Direction.DESC, "createdAt"));
        }
        return Sort.by(Sort.Direction.DESC, "createdAt");
    }

    private User getUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private Course getCourse(UUID courseId) {
        return courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
    }

    private double roundRating(Double rating) {
        if (rating == null) {
            return 0;
        }
        return Math.round(rating * 10.0) / 10.0;
    }
}
