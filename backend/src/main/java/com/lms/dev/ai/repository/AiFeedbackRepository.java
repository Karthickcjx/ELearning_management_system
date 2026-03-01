package com.lms.dev.ai.repository;

import com.lms.dev.ai.entity.AiFeedback;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiFeedbackRepository extends JpaRepository<AiFeedback, Long> {
}

