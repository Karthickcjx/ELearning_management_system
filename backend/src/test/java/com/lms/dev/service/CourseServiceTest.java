package com.lms.dev.service;

import com.lms.dev.entity.Course;
import com.lms.dev.repository.CourseRepository;
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
}
