package com.lms.dev.room.service;

import com.lms.dev.entity.Assessment;
import com.lms.dev.entity.Progress;
import com.lms.dev.entity.User;
import com.lms.dev.repository.AssessmentRepository;
import com.lms.dev.repository.ProgressRepository;
import com.lms.dev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RoomSkillService {

    private static final double ASSESSMENT_WEIGHT = 0.7;
    private static final double PROGRESS_WEIGHT = 0.3;

    private final UserRepository userRepository;
    private final AssessmentRepository assessmentRepository;
    private final ProgressRepository progressRepository;

    public double computeSkillScore(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<Assessment> assessments = assessmentRepository.findByUser(user);
        List<Progress> progressList = progressRepository.findByUser(user);

        Double assessmentScore = assessments.isEmpty() ? null : averageAssessmentScore(assessments);
        Double progressScore = progressList.isEmpty() ? null : averageProgressScore(progressList);

        if (assessmentScore == null && progressScore == null) {
            return 50.0;
        }
        if (assessmentScore == null) {
            return round2(progressScore);
        }
        if (progressScore == null) {
            return round2(assessmentScore);
        }

        double weighted = (assessmentScore * ASSESSMENT_WEIGHT) + (progressScore * PROGRESS_WEIGHT);
        return round2(weighted);
    }

    public int toSkillBand(double skillScore) {
        int band = (int) Math.floor(skillScore / 20.0);
        if (band < 0) {
            return 0;
        }
        return Math.min(band, 4);
    }

    private double averageAssessmentScore(List<Assessment> assessments) {
        double avg = assessments.stream()
                .mapToInt(Assessment::getMarks)
                .average()
                .orElse(50.0);
        return clamp(avg, 0.0, 100.0);
    }

    private double averageProgressScore(List<Progress> progressList) {
        double avg = progressList.stream()
                .mapToDouble(progress -> {
                    if (progress.getDuration() <= 0f) {
                        return 0.0;
                    }
                    double ratio = progress.getPlayedTime() / progress.getDuration();
                    return clamp(ratio * 100.0, 0.0, 100.0);
                })
                .average()
                .orElse(50.0);
        return clamp(avg, 0.0, 100.0);
    }

    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}

