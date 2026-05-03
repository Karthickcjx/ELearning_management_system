package com.lms.dev.progress.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

import java.util.UUID;
import com.lms.dev.user.entity.User;
import com.lms.dev.course.entity.Course;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(
        name = "progress",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_progress_user_course", columnNames = {"user_id", "course_id"})
        },
        indexes = {
                @Index(name = "idx_progress_user", columnList = "user_id"),
                @Index(name = "idx_progress_course", columnList = "course_id")
        }
)
public class Progress {
    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "course_id")
    private Course course;

    private float playedTime;
    private float duration;

    @Column(name = "completion_percentage", nullable = false)
    private int completionPercentage;

    @Column(nullable = false)
    private boolean completed;
}
