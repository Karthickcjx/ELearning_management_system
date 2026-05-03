package com.lms.dev.roadmap.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import com.lms.dev.user.entity.User;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "career_roadmap_plan")
public class CareerRoadmapPlan {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String domain;

    @Column(nullable = false)
    private String level;

    @Column(name = "target_role")
    private String targetRole;

    @Column(name = "weekly_hours")
    private Integer weeklyHours;

    @Column(name = "target_date")
    private LocalDate targetDate;

    @Column(name = "overview", columnDefinition = "TEXT")
    private String overview;

    @Column(name = "completion_percentage")
    private double completionPercentage;

    @ElementCollection
    @CollectionTable(name = "career_roadmap_key_principles", joinColumns = @JoinColumn(name = "plan_id"))
    @Column(name = "principle", columnDefinition = "TEXT")
    @OrderColumn(name = "item_order")
    private List<String> keyPrinciples = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "career_roadmap_career_outcomes", joinColumns = @JoinColumn(name = "plan_id"))
    @Column(name = "outcome", columnDefinition = "TEXT")
    @OrderColumn(name = "item_order")
    private List<String> careerOutcomes = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "career_roadmap_tools", joinColumns = @JoinColumn(name = "plan_id"))
    @Column(name = "tool_name", columnDefinition = "TEXT")
    @OrderColumn(name = "item_order")
    private List<String> toolsAndTechnologies = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "career_roadmap_practice_activities", joinColumns = @JoinColumn(name = "plan_id"))
    @Column(name = "activity", columnDefinition = "TEXT")
    @OrderColumn(name = "item_order")
    private List<String> practiceActivities = new ArrayList<>();

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("stepOrder ASC")
    private List<CareerRoadmapStep> steps = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public double calculateCompletionPercentage() {
        if (steps == null || steps.isEmpty()) {
            return 0.0;
        }

        long completedSteps = steps.stream().filter(CareerRoadmapStep::isCompleted).count();
        return (completedSteps * 100.0) / steps.size();
    }
}
