package com.lms.dev.course.service;

import com.lms.dev.course.dto.CourseContentResponse;
import com.lms.dev.course.entity.Course;
import com.lms.dev.course.repository.CourseRepository;
import com.lms.dev.learning.repository.LearningRepository;
import com.lms.dev.review.repository.CourseReviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CourseServiceTest {

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private CourseReviewRepository courseReviewRepository;

    @Mock
    private LearningRepository learningRepository;

    @InjectMocks
    private CourseService courseService;

    private UUID knownId;
    private UUID unknownId;
    private Course course;

    @BeforeEach
    void setUp() {
        knownId = UUID.randomUUID();
        unknownId = UUID.randomUUID();
        course = new Course();
        course.setCourse_id(knownId);
        course.setCourse_name("Test Course");
        course.setInstructor("Instructor");
        course.setPrice(0);
        course.setY_link("https://example.com/video.mp4");
    }

    @Test
    void getCourseById_whenExists_returnsCourse() {
        when(courseRepository.findById(knownId)).thenReturn(Optional.of(course));
        Course result = courseService.getCourseById(knownId);
        assertThat(result.getCourse_id()).isEqualTo(knownId);
    }

    @Test
    void getCourseById_whenNotFound_throws404() {
        when(courseRepository.findById(unknownId)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> courseService.getCourseById(unknownId))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void updateCourse_whenNotFound_throws404() {
        when(courseRepository.findById(unknownId)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> courseService.updateCourse(unknownId, new Course()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void getCourseContent_whenUserIsEnrolled_returnsVideoAccess() {
        UUID userId = UUID.randomUUID();
        when(courseRepository.findById(knownId)).thenReturn(Optional.of(course));
        when(learningRepository.existsByUserIdAndCourseId(userId, knownId)).thenReturn(true);

        CourseContentResponse result = courseService.getCourseContent(knownId, userId, false);

        assertThat(result.isEnrolled()).isTrue();
        assertThat(result.isAccessAllowed()).isTrue();
        assertThat(result.getVideoUrl()).isEqualTo(course.getY_link());
    }

    @Test
    void getCourseContent_whenUserIsNotEnrolled_throws403() {
        UUID userId = UUID.randomUUID();
        when(courseRepository.findById(knownId)).thenReturn(Optional.of(course));
        when(learningRepository.existsByUserIdAndCourseId(userId, knownId)).thenReturn(false);

        assertThatThrownBy(() -> courseService.getCourseContent(knownId, userId, false))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void getCourseContent_whenAdminIsNotEnrolled_returnsVideoAccess() {
        UUID adminId = UUID.randomUUID();
        when(courseRepository.findById(knownId)).thenReturn(Optional.of(course));

        CourseContentResponse result = courseService.getCourseContent(knownId, adminId, true);

        assertThat(result.isEnrolled()).isFalse();
        assertThat(result.isAccessAllowed()).isTrue();
        assertThat(result.getVideoUrl()).isEqualTo(course.getY_link());
    }
}
