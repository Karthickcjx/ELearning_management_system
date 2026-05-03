package com.lms.dev.course.dto;

import com.lms.dev.course.entity.Course;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class CourseResponse {

    private UUID course_id;
    private String course_name;
    private int price;
    private String instructor;
    private String description;
    private String p_link;
    private String y_link;
    private double averageRating;
    private long reviewCount;

    public static CourseResponse from(Course course, boolean includeVideoLink) {
        return CourseResponse.builder()
                .course_id(course.getCourse_id())
                .course_name(course.getCourse_name())
                .price(course.getPrice())
                .instructor(course.getInstructor())
                .description(course.getDescription())
                .p_link(course.getP_link())
                .y_link(includeVideoLink ? course.getY_link() : null)
                .averageRating(course.getAverageRating())
                .reviewCount(course.getReviewCount())
                .build();
    }
}
