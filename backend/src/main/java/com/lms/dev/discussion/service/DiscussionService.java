package com.lms.dev.discussion.service;
import java.util.List;
import java.util.UUID;

import com.lms.dev.discussion.dto.DiscussionRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.lms.dev.course.entity.Course;
import com.lms.dev.course.service.CourseService;
import com.lms.dev.discussion.entity.Discussion;
import com.lms.dev.discussion.repository.DiscussionRepository;

@RequiredArgsConstructor
@Service
public class DiscussionService {

    private final DiscussionRepository discussionRepository;
    private final CourseService courseService;

    public List<Discussion> getDiscussionsCourse(UUID courseId) {
        Course course = courseService.getCourseById(courseId);
        return discussionRepository.findByCourse(course);
    }
    public Discussion createDiscussion( DiscussionRequest discussionRequest) {
        Course course = courseService.getCourseById(discussionRequest.getCourse_id());
        Discussion discussion = new Discussion();
        discussion.setUserName(discussionRequest.getName());
        discussion.setCourse(course);
        discussion.setContent(discussionRequest.getContent());
        return discussionRepository.save(discussion);
    }
}
