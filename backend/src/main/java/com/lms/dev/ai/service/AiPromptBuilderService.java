package com.lms.dev.ai.service;

import com.lms.dev.ai.entity.AiSession;
import com.lms.dev.course.entity.Course;
import com.lms.dev.course.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AiPromptBuilderService {

    private final CourseRepository courseRepository;

    public String buildPrompt(AiSession session, String question, UUID overrideCourseId, String overrideLessonId) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are an LMS AI tutor. Answer with concise and clear steps. ");
        prompt.append("If context is missing, state assumptions and avoid fabrication.\n\n");

        Course contextCourse = resolveCourseContext(session, overrideCourseId);
        if (contextCourse != null) {
            prompt.append("Course context:\n");
            prompt.append("- Title: ").append(safe(contextCourse.getCourse_name())).append("\n");
            prompt.append("- Instructor: ").append(safe(contextCourse.getInstructor())).append("\n");
            prompt.append("- Description: ").append(safe(contextCourse.getDescription())).append("\n\n");
        }

        String lessonId = overrideLessonId != null && !overrideLessonId.isBlank()
                ? overrideLessonId
                : session.getLessonId();
        if (lessonId != null && !lessonId.isBlank()) {
            prompt.append("Lesson context: ").append(lessonId).append("\n\n");
        }

        prompt.append("Student question:\n");
        prompt.append(question);
        return prompt.toString();
    }

    private Course resolveCourseContext(AiSession session, UUID overrideCourseId) {
        if (overrideCourseId != null) {
            Optional<Course> course = courseRepository.findById(overrideCourseId);
            if (course.isPresent()) {
                return course.get();
            }
        }
        return session.getCourse();
    }

    private String safe(String value) {
        return value == null ? "N/A" : value;
    }
}

