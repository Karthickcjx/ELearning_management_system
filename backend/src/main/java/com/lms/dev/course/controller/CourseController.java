package com.lms.dev.course.controller;

import com.lms.dev.common.dto.ApiResponse;
import com.lms.dev.course.dto.CourseContentResponse;
import com.lms.dev.course.dto.CourseResponse;
import com.lms.dev.course.entity.Course;
import com.lms.dev.course.service.CourseService;
import com.lms.dev.security.SecurityAccessService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final SecurityAccessService securityAccessService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CourseResponse>>> getAllCourses(Authentication authentication) {
        List<Course> courses = courseService.getAllCourses();
        boolean includeVideoLinks = securityAccessService.isAdmin(authentication);
        List<CourseResponse> response = courses.stream()
                .map(course -> CourseResponse.from(course, includeVideoLinks))
                .toList();
        return ResponseEntity.ok(new ApiResponse<>("Courses retrieved successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseResponse>> getCourseById(@PathVariable UUID id, Authentication authentication) {
        Course course = courseService.getCourseById(id);
        UUID currentUserId = securityAccessService.requireCurrentUserId(authentication);
        boolean includeVideoLink = courseService.canAccessCourseContent(
                id,
                currentUserId,
                securityAccessService.isAdmin(authentication)
        );
        return ResponseEntity.ok(new ApiResponse<>(
                "Course retrieved successfully",
                CourseResponse.from(course, includeVideoLink)
        ));
    }

    @GetMapping("/{id}/content")
    public ResponseEntity<ApiResponse<CourseContentResponse>> getCourseContent(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID currentUserId = securityAccessService.requireCurrentUserId(authentication);
        CourseContentResponse content = courseService.getCourseContent(
                id,
                currentUserId,
                securityAccessService.isAdmin(authentication)
        );
        return ResponseEntity.ok(new ApiResponse<>("Course content retrieved successfully", content));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<Course>> createCourse(@Valid @RequestBody Course course) {
        Course created = courseService.createCourse(course);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>("Course created successfully", created));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Course>> updateCourse(
            @PathVariable UUID id,
            @Valid @RequestBody Course updatedCourse) {
        Course updated = courseService.updateCourse(id, updatedCourse);
        return ResponseEntity.ok(new ApiResponse<>("Course updated successfully", updated));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(@PathVariable UUID id) {
        courseService.deleteCourse(id);
        return ResponseEntity.ok(new ApiResponse<>("Course deleted successfully", null));
    }
}
