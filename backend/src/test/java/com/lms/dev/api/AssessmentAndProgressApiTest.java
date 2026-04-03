package com.lms.dev.api;

import io.restassured.response.Response;
import org.junit.jupiter.api.*;

import java.util.List;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * Assessment & Progress API Tests
 * TC-AS01–AS04, TC-V04, TC-V09
 */
@DisplayName("Assessment & Progress API Tests")
class AssessmentAndProgressApiTest extends BaseApiTest {

    private String enrolledCourseId;

    @BeforeEach
    void findEnrolledCourse() {
        if (userToken == null) return;

        Response learningRes = asUser()
                .when()
                .get("/api/learning");

        if (learningRes.statusCode() == 200) {
            List<Map<String, Object>> enrollments = learningRes.jsonPath().getList("data");
            if (enrollments != null && !enrollments.isEmpty()) {
                Object course = enrollments.get(0).get("course");
                if (course instanceof Map) {
                    enrolledCourseId = String.valueOf(((Map<?, ?>) course).get("id"));
                } else {
                    enrolledCourseId = String.valueOf(enrollments.get(0).get("courseId"));
                }
            }
        }
    }

    // ── TC-V04: Get progress ──────────────────────────────────────────────
    @Test
    @DisplayName("GET /api/progress/{userId}/{courseId} returns progress data")
    void getProgressForEnrolledCourse() {
        Assumptions.assumeTrue(userId != null && enrolledCourseId != null, "Enrolled course required");

        asUser()
            .when()
            .get("/api/progress/" + userId + "/" + enrolledCourseId)
        .then()
            .statusCode(200)
            .body("data", notNullValue());
    }

    // ── TC-V09: Update video duration ────────────────────────────────────
    @Test
    @DisplayName("PUT /api/progress/update-duration updates duration successfully")
    void updateVideoDuration() {
        Assumptions.assumeTrue(userId != null && enrolledCourseId != null, "Enrolled course required");

        asUser()
            .body(String.format(
                "{\"userId\":\"%s\",\"courseId\":\"%s\",\"totalDuration\":600}",
                userId, enrolledCourseId
            ))
            .when()
            .put("/api/progress/update-duration")
        .then()
            .statusCode(anyOf(is(200), is(201)));
    }

    // ── TC-V04: Update video progress ─────────────────────────────────────
    @Test
    @DisplayName("PUT /api/progress/update-progress stores progress percentage")
    void updateVideoProgress() {
        Assumptions.assumeTrue(userId != null && enrolledCourseId != null, "Enrolled course required");

        asUser()
            .body(String.format(
                "{\"userId\":\"%s\",\"courseId\":\"%s\",\"watchedDuration\":300,\"totalDuration\":600}",
                userId, enrolledCourseId
            ))
            .when()
            .put("/api/progress/update-progress")
        .then()
            .statusCode(anyOf(is(200), is(201)));
    }

    // ── Progress summary endpoint ─────────────────────────────────────────
    @Test
    @DisplayName("GET /api/progress/summary/{userId}/{courseId} returns summary")
    void getProgressSummary() {
        Assumptions.assumeTrue(userId != null && enrolledCourseId != null, "Enrolled course required");

        asUser()
            .when()
            .get("/api/progress/summary/" + userId + "/" + enrolledCourseId)
        .then()
            .statusCode(anyOf(is(200), is(404)));
    }

    // ── TC-AS01: Submit assessment ────────────────────────────────────────
    @Test
    @DisplayName("POST /api/assessments/add/{userId}/{courseId} returns score")
    void submitAssessment() {
        Assumptions.assumeTrue(userId != null && enrolledCourseId != null, "Enrolled course required");

        // Get questions first
        Response qRes = asUser()
                .when()
                .get("/api/questions/course/" + enrolledCourseId);

        Assumptions.assumeTrue(qRes.statusCode() == 200, "Questions must exist for course");
        List<Map<String, Object>> questions = qRes.jsonPath().getList("data");
        Assumptions.assumeTrue(questions != null && !questions.isEmpty(), "At least one question required");

        // Build answers array
        StringBuilder answers = new StringBuilder("[");
        for (int i = 0; i < questions.size(); i++) {
            String qId = String.valueOf(questions.get(i).get("id"));
            answers.append(String.format("{\"questionId\":\"%s\",\"answer\":\"A\"}", qId));
            if (i < questions.size() - 1) answers.append(",");
        }
        answers.append("]");

        asUser()
            .body(String.format("{\"answers\":%s}", answers))
            .when()
            .post("/api/assessments/add/" + userId + "/" + enrolledCourseId)
        .then()
            .statusCode(anyOf(is(200), is(201)))
            .body("data", notNullValue());
    }

    // ── TC-AS03: Get assessment history ──────────────────────────────────
    @Test
    @DisplayName("GET /api/assessments/user/{userId}/course/{courseId} returns history")
    void getAssessmentHistory() {
        Assumptions.assumeTrue(userId != null && enrolledCourseId != null, "Enrolled course required");

        asUser()
            .when()
            .get("/api/assessments/user/" + userId + "/course/" + enrolledCourseId)
        .then()
            .statusCode(anyOf(is(200), is(404)));
    }

    // ── Performance endpoint ──────────────────────────────────────────────
    @Test
    @DisplayName("GET /api/assessments/performance/{userId} returns performance data")
    void getPerformance() {
        Assumptions.assumeTrue(userId != null, "User ID required");

        asUser()
            .when()
            .get("/api/assessments/performance/" + userId)
        .then()
            .statusCode(anyOf(is(200), is(404)));
    }
}
