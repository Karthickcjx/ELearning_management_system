package com.lms.dev.roadmap.service;

import com.lms.dev.roadmap.dto.DomainLearningPlanDTO;
import com.lms.dev.roadmap.dto.DomainTheoryDTO;
import com.lms.dev.roadmap.dto.RoadmapGenerateRequest;
import com.lms.dev.roadmap.dto.RoadmapResponseDTO;
import com.lms.dev.roadmap.dto.RoadmapStepDTO;
import com.lms.dev.roadmap.entity.CareerRoadmapPlan;
import com.lms.dev.roadmap.entity.CareerRoadmapStep;
import com.lms.dev.user.entity.User;
import com.lms.dev.roadmap.repository.CareerRoadmapPlanRepository;
import com.lms.dev.user.repository.UserRepository;
import com.lms.dev.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RoadmapService {

    private static final String BEGINNER = "Beginner";
    private static final String INTERMEDIATE = "Intermediate";
    private static final String ADVANCED = "Advanced";

    private static final List<String> DEFAULT_TOOLS = List.of(
            "Version control",
            "Core framework",
            "Testing tools",
            "Observability tools",
            "Documentation",
            "Automation workflow"
    );

    private static final Map<String, DomainTheoryDTO> DOMAIN_THEORIES = Map.of(
            "Software Engineering", DomainTheoryDTO.builder()
                    .overview("Software Engineering builds maintainable and scalable systems from real product requirements.")
                    .keyPrinciples(List.of("Abstraction and modularity", "Testing and quality", "Security and performance", "Reliable delivery"))
                    .careerOutcomes(List.of("Backend engineer", "Full-stack engineer", "Platform engineer"))
                    .build(),
            "Data Science", DomainTheoryDTO.builder()
                    .overview("Data Science turns data into measurable decisions through statistics, experimentation, and machine learning.")
                    .keyPrinciples(List.of("Statistical reasoning", "Data quality", "Model validation", "Reproducibility"))
                    .careerOutcomes(List.of("Data scientist", "ML engineer", "Analytics specialist"))
                    .build(),
            "Cybersecurity", DomainTheoryDTO.builder()
                    .overview("Cybersecurity protects systems and users through risk-driven controls, monitoring, and response.")
                    .keyPrinciples(List.of("CIA triad", "Defense in depth", "Threat modeling", "Continuous monitoring"))
                    .careerOutcomes(List.of("Security analyst", "Penetration tester", "Security architect"))
                    .build(),
            "Product Management", DomainTheoryDTO.builder()
                    .overview("Product Management aligns customer problems, business value, and engineering execution.")
                    .keyPrinciples(List.of("Problem discovery", "Prioritization", "Outcome orientation", "Cross-functional leadership"))
                    .careerOutcomes(List.of("Product manager", "Growth PM", "Group PM"))
                    .build(),
            "Cloud Engineering", DomainTheoryDTO.builder()
                    .overview("Cloud Engineering designs and runs resilient services with automation, observability, and cost control.")
                    .keyPrinciples(List.of("Elastic design", "Infrastructure as code", "Reliability", "Security by default"))
                    .careerOutcomes(List.of("Cloud engineer", "SRE", "Cloud architect"))
                    .build(),
            "UI/UX Design", DomainTheoryDTO.builder()
                    .overview("UI/UX Design creates usable and accessible product experiences from research to implementation.")
                    .keyPrinciples(List.of("Human-centered design", "Information architecture", "Visual hierarchy", "Accessibility"))
                    .careerOutcomes(List.of("Product designer", "UX researcher", "Design systems designer"))
                    .build(),
            "DevOps", DomainTheoryDTO.builder()
                    .overview("DevOps accelerates delivery by combining engineering and operations with shared ownership.")
                    .keyPrinciples(List.of("Automation first", "Continuous delivery", "Observability", "Resilience"))
                    .careerOutcomes(List.of("DevOps engineer", "Release engineer", "Platform engineer"))
                    .build(),
            "Digital Marketing", DomainTheoryDTO.builder()
                    .overview("Digital Marketing drives growth through channel strategy, campaign experiments, and analytics.")
                    .keyPrinciples(List.of("Audience targeting", "Channel fit", "Experimentation", "Performance measurement"))
                    .careerOutcomes(List.of("Growth marketer", "Performance marketer", "Marketing strategist"))
                    .build()
    );

    private static final Map<String, List<String>> DOMAIN_TOOLS = Map.of(
            "Software Engineering", List.of("Java", "Spring Boot", "React", "PostgreSQL", "Git", "Docker"),
            "Data Science", List.of("Python", "Pandas", "SQL", "Jupyter", "Scikit-learn", "Power BI"),
            "Cybersecurity", List.of("Nmap", "Wireshark", "Burp Suite", "SIEM", "Linux", "OWASP tools"),
            "Product Management", List.of("Jira", "Notion", "Miro", "Figma", "Amplitude", "Google Analytics"),
            "Cloud Engineering", List.of("AWS or Azure", "Terraform", "Kubernetes", "Docker", "Prometheus", "Grafana"),
            "UI/UX Design", List.of("Figma", "FigJam", "Design tokens", "Storybook", "Maze", "Hotjar"),
            "DevOps", List.of("GitHub Actions", "Jenkins", "Docker", "Kubernetes", "Terraform", "Grafana"),
            "Digital Marketing", List.of("Google Analytics", "Google Ads", "Meta Ads", "SEMrush", "HubSpot", "Canva")
    );

    private final UserRepository userRepository;
    private final CareerRoadmapPlanRepository roadmapPlanRepository;

    @Transactional(readOnly = true)
    public List<String> getAvailableDomains() {
        return DOMAIN_THEORIES.keySet().stream().sorted().toList();
    }

    @Transactional(readOnly = true)
    public RoadmapResponseDTO previewRoadmap(RoadmapGenerateRequest request) {
        return generateRoadmapResponse(request, null, null);
    }

    @Transactional
    public RoadmapResponseDTO createRoadmapForCurrentUser(UserPrincipal userPrincipal, RoadmapGenerateRequest request) {
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        RoadmapResponseDTO generated = generateRoadmapResponse(request, null, null);

        CareerRoadmapPlan plan = new CareerRoadmapPlan();
        plan.setUser(user);
        plan.setDomain(generated.getDomain());
        plan.setLevel(generated.getLevel());
        plan.setTargetRole(generated.getTargetRole());
        plan.setWeeklyHours(generated.getWeeklyHours());
        plan.setTargetDate(generated.getTargetDate());
        plan.setOverview(generated.getTheory().getOverview());
        plan.setKeyPrinciples(new ArrayList<>(generated.getTheory().getKeyPrinciples()));
        plan.setCareerOutcomes(new ArrayList<>(generated.getTheory().getCareerOutcomes()));
        plan.setToolsAndTechnologies(new ArrayList<>(generated.getLearningPlan().getToolsAndTechnologies()));
        plan.setPracticeActivities(new ArrayList<>(generated.getLearningPlan().getPracticeActivities()));

        List<CareerRoadmapStep> stepEntities = new ArrayList<>();
        for (RoadmapStepDTO stepDTO : generated.getSteps()) {
            CareerRoadmapStep step = new CareerRoadmapStep();
            step.setPlan(plan);
            step.setStepOrder(stepDTO.getStepOrder());
            step.setTitle(stepDTO.getTitle());
            step.setDescription(stepDTO.getDescription());
            step.setCompleted(false);
            stepEntities.add(step);
        }

        plan.setSteps(stepEntities);
        plan.setCompletionPercentage(0.0);

        CareerRoadmapPlan saved = roadmapPlanRepository.save(plan);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<RoadmapResponseDTO> getRoadmapsForCurrentUser(UserPrincipal userPrincipal) {
        return roadmapPlanRepository.findByUser_IdOrderByCreatedAtDesc(userPrincipal.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public RoadmapResponseDTO updateStepStatus(UserPrincipal userPrincipal, UUID planId, int stepOrder, boolean completed) {
        CareerRoadmapPlan plan = roadmapPlanRepository.findByIdAndUser_Id(planId, userPrincipal.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Roadmap not found"));

        CareerRoadmapStep step = plan.getSteps().stream()
                .filter(candidate -> candidate.getStepOrder() == stepOrder)
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Step not found"));

        step.setCompleted(completed);
        plan.setCompletionPercentage(roundPercentage(plan.calculateCompletionPercentage()));

        CareerRoadmapPlan updated = roadmapPlanRepository.save(plan);
        return mapToResponse(updated);
    }

    private RoadmapResponseDTO generateRoadmapResponse(RoadmapGenerateRequest request, UUID planId, Double completionPercentage) {
        String resolvedDomain = resolveDomain(request.getDomain());
        String normalizedLevel = normalizeLevel(request.getLevel());
        String targetRole = normalizeOptional(request.getTargetRole());
        Integer weeklyHours = request.getWeeklyHours();
        LocalDate targetDate = request.getTargetDate();

        DomainTheoryDTO theory = DOMAIN_THEORIES.getOrDefault(resolvedDomain, buildDefaultTheory(resolvedDomain));
        List<String> tools = DOMAIN_TOOLS.getOrDefault(resolvedDomain, DEFAULT_TOOLS);
        List<String> practices = buildPracticeActivities(normalizedLevel);
        List<String> rawSteps = buildSteps(resolvedDomain, normalizedLevel);

        List<RoadmapStepDTO> steps = new ArrayList<>();
        for (int index = 0; index < rawSteps.size(); index++) {
            String rawStep = rawSteps.get(index);
            steps.add(RoadmapStepDTO.builder()
                    .stepOrder(index + 1)
                    .title(rawStep)
                    .description(buildDescription(rawStep, normalizedLevel, targetRole, weeklyHours, targetDate))
                    .completed(false)
                    .build());
        }

        DomainLearningPlanDTO learningPlan = DomainLearningPlanDTO.builder()
                .toolsAndTechnologies(tools)
                .practiceActivities(practices)
                .build();

        return RoadmapResponseDTO.builder()
                .planId(planId)
                .domain(resolvedDomain)
                .level(normalizedLevel)
                .targetRole(targetRole)
                .weeklyHours(weeklyHours)
                .targetDate(targetDate)
                .theory(theory)
                .learningPlan(learningPlan)
                .steps(steps)
                .completionPercentage(completionPercentage == null ? 0.0 : roundPercentage(completionPercentage))
                .build();
    }

    private List<String> buildSteps(String domain, String level) {
        if (ADVANCED.equals(level)) {
            return List.of(
                    "Design scalable " + domain + " architecture and technical standards",
                    "Implement performance, reliability, and security hardening strategy",
                    "Lead cross-team execution and mentorship for major initiatives",
                    "Measure business impact and publish improvement roadmap"
            );
        }

        if (INTERMEDIATE.equals(level)) {
            return List.of(
                    "Apply core " + domain + " concepts in real project scenarios",
                    "Build reusable workflows with quality and testing checks",
                    "Ship one production-grade project and collect metrics",
                    "Improve through feedback, retrospectives, and iteration"
            );
        }

        return List.of(
                "Learn " + domain + " fundamentals and essential terminology",
                "Practice core tools through guided exercises",
                "Build a small portfolio-ready mini project",
                "Document outcomes and define your next learning sprint"
        );
    }

    private List<String> buildPracticeActivities(String level) {
        if (ADVANCED.equals(level)) {
            return List.of(
                    "Lead one high-impact project from planning to delivery",
                    "Mentor peers and formalize best practices",
                    "Track business-level KPIs and optimize continuously"
            );
        }

        if (INTERMEDIATE.equals(level)) {
            return List.of(
                    "Ship medium-size projects with quality gates",
                    "Collaborate in code or design reviews each week",
                    "Track delivery and outcome metrics for each milestone"
            );
        }

        return List.of(
                "Study foundational concepts daily",
                "Complete one practical exercise every week",
                "Publish one learning artifact per month"
        );
    }

    private RoadmapResponseDTO mapToResponse(CareerRoadmapPlan plan) {
        List<RoadmapStepDTO> stepDTOs = plan.getSteps().stream()
                .sorted(Comparator.comparingInt(CareerRoadmapStep::getStepOrder))
                .map(step -> RoadmapStepDTO.builder()
                        .stepOrder(step.getStepOrder())
                        .title(step.getTitle())
                        .description(step.getDescription())
                        .completed(step.isCompleted())
                        .build())
                .toList();

        double completionPercentage = roundPercentage(plan.calculateCompletionPercentage());

        return RoadmapResponseDTO.builder()
                .planId(plan.getId())
                .domain(plan.getDomain())
                .level(plan.getLevel())
                .targetRole(plan.getTargetRole())
                .weeklyHours(plan.getWeeklyHours())
                .targetDate(plan.getTargetDate())
                .theory(DomainTheoryDTO.builder()
                        .overview(plan.getOverview())
                        .keyPrinciples(plan.getKeyPrinciples())
                        .careerOutcomes(plan.getCareerOutcomes())
                        .build())
                .learningPlan(DomainLearningPlanDTO.builder()
                        .toolsAndTechnologies(plan.getToolsAndTechnologies())
                        .practiceActivities(plan.getPracticeActivities())
                        .build())
                .steps(stepDTOs)
                .completionPercentage(completionPercentage)
                .build();
    }

    private String resolveDomain(String requestedDomain) {
        if (requestedDomain == null || requestedDomain.isBlank()) {
            return "General Professional Development";
        }

        String normalizedInput = requestedDomain.trim();
        for (String knownDomain : DOMAIN_THEORIES.keySet()) {
            if (knownDomain.equalsIgnoreCase(normalizedInput)) {
                return knownDomain;
            }
        }

        return normalizedInput;
    }

    private String normalizeLevel(String level) {
        if (level == null) {
            return BEGINNER;
        }

        return switch (level.trim().toLowerCase(Locale.ROOT)) {
            case "intermediate" -> INTERMEDIATE;
            case "advanced" -> ADVANCED;
            default -> BEGINNER;
        };
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String buildDescription(String step, String level, String targetRole, Integer weeklyHours, LocalDate targetDate) {
        String baseDescription = switch (level) {
            case ADVANCED -> "Lead " + step + " with architecture-level decisions and measurable outcomes.";
            case INTERMEDIATE -> "Apply " + step + " in collaborative projects and track quality metrics.";
            default -> "Understand " + step + " through guided learning and a focused deliverable.";
        };

        List<String> personalization = new ArrayList<>();
        if (targetRole != null) {
            personalization.add("Align this milestone with your " + targetRole + " goal.");
        }
        if (weeklyHours != null) {
            personalization.add("Plan around " + weeklyHours + " focused hours each week.");
        }
        if (targetDate != null) {
            personalization.add("Target completion by " + targetDate + ".");
        }

        if (personalization.isEmpty()) {
            return baseDescription;
        }

        return baseDescription + " " + String.join(" ", personalization);
    }

    private DomainTheoryDTO buildDefaultTheory(String domain) {
        return DomainTheoryDTO.builder()
                .overview(domain + " combines fundamentals, execution, and measurable outcomes.")
                .keyPrinciples(List.of("Fundamentals first", "Deliberate practice", "Continuous feedback", "Iteration"))
                .careerOutcomes(List.of("Entry-level contributor", "Skilled practitioner", "Strategic leader"))
                .build();
    }

    private double roundPercentage(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
