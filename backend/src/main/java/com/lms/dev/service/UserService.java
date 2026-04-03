package com.lms.dev.service;

import com.lms.dev.dto.InterestsRequest;
import com.lms.dev.dto.UpdateUserRequest;
import com.lms.dev.entity.User;
import com.lms.dev.entity.Progress;
import com.lms.dev.enums.UserRole;
import com.lms.dev.repository.ProgressRepository;
import com.lms.dev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ProgressRepository progressRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    public User createUser(User user) {
        if (userRepository.findByEmail(user.getEmail()) != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
        }
        user.setRole(UserRole.USER);
        user.setIsActive(true);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public void updateUserProfile(MultipartFile file, UUID id) throws IOException {
        User user = getUserById(id);
        user.setProfileImage(file.getBytes());
        userRepository.save(user);
    }

    public User updateUser(UUID id, UpdateUserRequest request) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        existing.setUsername(request.getUsername());
        existing.setDob(request.getDob());
        existing.setMobileNumber(request.getMobileNumber());
        existing.setGender(request.getGender());
        existing.setLocation(request.getLocation());
        existing.setProfession(request.getProfession());
        existing.setLinkedin_url(request.getLinkedin_url());
        existing.setGithub_url(request.getGithub_url());
        existing.setOccupation(request.getOccupation());
        existing.setLearningField(request.getLearningField());
        // role, email, password, isActive are deliberately NOT updated here
        return userRepository.save(existing);
    }

    public void saveInterests(InterestsRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setLearningField(request.getLearningField());
        user.setOccupation(request.getOccupation());
        userRepository.save(user);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Map<String, Object> getUserDashboardStats(UUID id) {
        User user = getUserById(id);
        long enrolledCourses = user.getLearningCourses() != null ? user.getLearningCourses().size() : 0;

        List<Progress> userProgress = progressRepository.findByUser(user);
        long completed = 0;
        float totalHoursLearned = 0;

        for (Progress p : userProgress) {
            totalHoursLearned += p.getPlayedTime();
            if (p.getDuration() > 0 && p.getPlayedTime() >= p.getDuration()) {
                completed++;
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("enrolledCourses", enrolledCourses);
        stats.put("completed", completed);
        stats.put("hoursLearned", Math.round(totalHoursLearned));
        stats.put("certificates", completed);
        return stats;
    }

    public void deleteUser(UUID id) {
        userRepository.deleteById(id);
    }

    public void updatePassword(String email, String newPassword) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
