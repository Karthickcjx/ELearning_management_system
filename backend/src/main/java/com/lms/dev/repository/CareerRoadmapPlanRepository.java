package com.lms.dev.repository;

import com.lms.dev.entity.CareerRoadmapPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CareerRoadmapPlanRepository extends JpaRepository<CareerRoadmapPlan, UUID> {
    List<CareerRoadmapPlan> findByUser_IdOrderByCreatedAtDesc(UUID userId);
    Optional<CareerRoadmapPlan> findByIdAndUser_Id(UUID planId, UUID userId);
}
