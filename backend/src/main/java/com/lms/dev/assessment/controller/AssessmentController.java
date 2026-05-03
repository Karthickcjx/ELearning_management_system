package com.lms.dev.assessment.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.lms.dev.assessment.entity.Assessment;
import com.lms.dev.course.entity.Course;
import com.lms.dev.user.entity.User;
import com.lms.dev.security.SecurityAccessService;
import com.lms.dev.assessment.service.AssessmentService;
import com.lms.dev.course.service.CourseService;
import com.lms.dev.user.service.UserService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/assessments")
@RequiredArgsConstructor
public class AssessmentController {

    private final AssessmentService assessmentService;
    private final UserService userService;
    private final CourseService courseService;
    private final SecurityAccessService securityAccessService;

    @GetMapping("/user/{userId}/course/{courseId}")
    public ResponseEntity<List<Assessment>> getAssessmentsByUserAndCourse(
            @PathVariable UUID userId,
            @PathVariable UUID courseId,
            Authentication authentication
    ) {
        securityAccessService.assertSelfOrAdmin(authentication, userId);
    	User user = userService.getUserById(userId);
        Course course = courseService.getCourseById(courseId);
        if (user == null || course == null) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "User or course not found");
        }

        List<Assessment> assessments = assessmentService.getAssessmentsByUserAndCourse(user, course);
        return ResponseEntity.ok(assessments);
    }
    
    @GetMapping("/performance/{userId}")
    public ResponseEntity<List<Assessment>> getAssessmentsByUser(@PathVariable UUID userId, Authentication authentication){
        securityAccessService.assertSelfOrAdmin(authentication, userId);
    	User user = userService.getUserById(userId);
        if (user == null) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "User not found");
        }
    	return assessmentService.getAssessmentByUser(user);
    }
    
    @PostMapping("/add/{userId}/{courseId}")
    public ResponseEntity<Assessment> addAssessmentWithMarks(
            @PathVariable UUID userId,
            @PathVariable UUID courseId,
            @RequestBody Assessment assessment,
            Authentication authentication) {
        securityAccessService.assertSelfOrAdmin(authentication, userId);
    	
        User user = userService.getUserById(userId);
        Course course = courseService.getCourseById(courseId);
        if (user == null || course == null) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "User or course not found");
        }
        return assessmentService.saveAssessment(user , course, assessment);
    }
}
