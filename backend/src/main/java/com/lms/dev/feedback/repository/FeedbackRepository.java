package com.lms.dev.feedback.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lms.dev.feedback.entity.Feedback;

import java.util.UUID;

public interface FeedbackRepository extends JpaRepository<Feedback, UUID> {
}
