package com.lms.dev.ai.entity;

import com.lms.dev.ai.enums.AiSessionStatus;
import com.lms.dev.entity.Course;
import com.lms.dev.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "ai_session",
        indexes = {
                @Index(name = "idx_ai_session_user_last", columnList = "user_id, last_activity_at"),
                @Index(name = "idx_ai_session_course", columnList = "course_id")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiSession {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @Column(name = "lesson_id", length = 120)
    private String lessonId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AiSessionStatus status;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "last_activity_at", nullable = false)
    private LocalDateTime lastActivityAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (status == null) {
            status = AiSessionStatus.ACTIVE;
        }
        startedAt = now;
        lastActivityAt = now;
    }

    public void touch() {
        this.lastActivityAt = LocalDateTime.now();
    }
}

