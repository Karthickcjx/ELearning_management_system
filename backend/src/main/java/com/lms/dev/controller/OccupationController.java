package com.lms.dev.controller;

import com.lms.dev.dto.InterestsRequest;
import com.lms.dev.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequiredArgsConstructor
public class OccupationController {

    private final UserService userService;

    private static final Map<String, List<String>> FIELD_OCCUPATIONS = new LinkedHashMap<>();

    static {
        FIELD_OCCUPATIONS.put("Software Development", Arrays.asList(
                "Front End Developer", "Back End Developer", "Full Stack Developer",
                "Python Developer", "Java Developer", "Software Architect",
                "DevOps Engineer", "Web Developer"));
        FIELD_OCCUPATIONS.put("Data & Analytics", Arrays.asList(
                "Data Analyst", "Data Scientist", "Data Engineer",
                "Machine Learning Engineer", "Business Intelligence Analyst"));
        FIELD_OCCUPATIONS.put("Information Technology", Arrays.asList(
                "System Administrator", "Network Engineer", "IT Support Specialist",
                "Cloud Engineer", "Cybersecurity Analyst", "Database Administrator"));
        FIELD_OCCUPATIONS.put("Marketing", Arrays.asList(
                "Digital Marketer", "SEO Specialist", "Social Media Manager",
                "Content Marketer", "Marketing Analyst"));
        FIELD_OCCUPATIONS.put("Design", Arrays.asList(
                "UI Designer", "UX Designer", "Graphic Designer", "Product Designer"));
        FIELD_OCCUPATIONS.put("Finance & Accounting", Arrays.asList(
                "Financial Analyst", "Accountant", "Auditor",
                "Tax Consultant", "Investment Banker", "Bookkeeper"));
        FIELD_OCCUPATIONS.put("Human Resources", Arrays.asList(
                "HR Manager", "Recruiter", "Talent Acquisition Specialist",
                "Compensation Analyst", "Training Coordinator"));
        FIELD_OCCUPATIONS.put("Education & Training", Arrays.asList(
                "Instructor", "Curriculum Designer", "Corporate Trainer",
                "E-Learning Developer", "Academic Advisor"));
        FIELD_OCCUPATIONS.put("Customer Support", Arrays.asList(
                "Customer Service Representative", "Technical Support Engineer",
                "Help Desk Analyst", "Customer Success Manager", "Support Team Lead"));
        FIELD_OCCUPATIONS.put("Health & Wellness", Arrays.asList(
                "Health Coach", "Nutritionist", "Fitness Trainer",
                "Wellness Coordinator", "Public Health Analyst"));
    }

    @GetMapping("/api/occupations/{field}")
    public ResponseEntity<Map<String, Object>> getOccupations(@PathVariable String field) {
        List<String> occupations = FIELD_OCCUPATIONS.get(field);
        if (occupations == null) {
            // Try case-insensitive lookup
            for (Map.Entry<String, List<String>> entry : FIELD_OCCUPATIONS.entrySet()) {
                if (entry.getKey().equalsIgnoreCase(field)) {
                    occupations = entry.getValue();
                    field = entry.getKey();
                    break;
                }
            }
        }
        if (occupations == null) {
            return ResponseEntity.notFound().build();
        }
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("field", field);
        response.put("occupations", occupations);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/occupations")
    public ResponseEntity<List<String>> getAllFields() {
        return ResponseEntity.ok(new ArrayList<>(FIELD_OCCUPATIONS.keySet()));
    }

    @PostMapping("/api/profile/interests")
    public ResponseEntity<Map<String, String>> saveInterests(@RequestBody InterestsRequest request) {
        userService.saveInterests(request);
        Map<String, String> response = new LinkedHashMap<>();
        response.put("status", "success");
        response.put("message", "Interests saved successfully");
        return ResponseEntity.ok(response);
    }
}
