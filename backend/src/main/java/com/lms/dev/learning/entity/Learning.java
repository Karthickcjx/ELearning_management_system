package com.lms.dev.learning.entity;
import com.fasterxml.jackson.annotation.JsonIgnore;

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
        name = "learning",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_learning_user_course", columnNames = {"user_id", "course_id"})
        },
        indexes = {
                @Index(name = "idx_learning_user", columnList = "user_id"),
                @Index(name = "idx_learning_course", columnList = "course_id")
        }
)
public class Learning {
    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne
    @JsonIgnore
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JsonIgnore
    @JoinColumn(name = "course_id")
    private Course course;
}
