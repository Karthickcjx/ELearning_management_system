package com.lms.dev.api;

import io.restassured.response.Response;
import org.junit.jupiter.api.*;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * Course API Tests — covers /api/courses/* endpoints
 * TC-C01, TC-C05–C10
 */
@DisplayName("Course API Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class CourseApiTest extends BaseApiTest {

    private static String createdCourseId;

    // ── TC-C01: Get published courses (user) ──────────────────────────────
    @Test
    @Order(1)
    @DisplayName("GET /api/courses/published returns list of published courses")
    void getPublishedCourses() {
        asUser()
            .when()
            .get("/api/courses/published")
        .then()
            .statusCode(200)
            .body("data", not(nullValue()));
    }

    // ── GET all courses (admin) ────────────────────────────────────────────
    @Test
    @Order(2)
    @DisplayName("GET /api/courses returns all courses for admin")
    void getAllCoursesAsAdmin() {
        asAdmin()
            .when()
            .get("/api/courses")
        .then()
            .statusCode(200)
            .body("data", not(nullValue()));
    }

    // ── TC-C05: Admin creates course ──────────────────────────────────────
    @Test
    @Order(3)
    @DisplayName("POST /api/courses creates a new course when called by admin")
    void adminCreatesCourse() {
        Response response = asAdmin()
            .body("{\"name\":\"API Test Course\",\"description\":\"Created by REST Assured\",\"instructor\":\"QA\",\"price\":0}")
            .when()
            .post("/api/courses");

        response.then()
            .statusCode(200)
            .body("data.id", notNullValue())
            .body("data.name", equalTo("API Test Course"));

        createdCourseId = response.jsonPath().getString("data.id");
    }

    // ── TC-C10: User cannot create course ────────────────────────────────
    @Test
    @Order(4)
    @DisplayName("POST /api/courses returns 403 when called by regular user")
    void userCannotCreateCourse() {
        asUser()
            .body("{\"name\":\"Hacked Course\",\"description\":\"Should fail\",\"instructor\":\"Hacker\",\"price\":0}")
            .when()
            .post("/api/courses")
        .then()
            .statusCode(403);
    }

    // ── TC-C06: Admin updates course ─────────────────────────────────────
    @Test
    @Order(5)
    @DisplayName("PUT /api/courses/{id} updates course successfully")
    void adminUpdatesCourse() {
        Assumptions.assumeTrue(createdCourseId != null, "Course creation must have succeeded");

        asAdmin()
            .body("{\"name\":\"API Test Course UPDATED\",\"description\":\"Updated\",\"instructor\":\"QA\",\"price\":99}")
            .when()
            .put("/api/courses/" + createdCourseId)
        .then()
            .statusCode(200)
            .body("data.name", equalTo("API Test Course UPDATED"));
    }

    // ── TC-C08: Toggle publish ────────────────────────────────────────────
    @Test
    @Order(6)
    @DisplayName("PUT /api/courses/{id}/toggle-publish changes publish state")
    void adminTogglesCoursePublish() {
        Assumptions.assumeTrue(createdCourseId != null, "Course creation must have succeeded");

        asAdmin()
            .when()
            .put("/api/courses/" + createdCourseId + "/toggle-publish")
        .then()
            .statusCode(200);
    }

    // ── GET by invalid ID → 404 ───────────────────────────────────────────
    @Test
    @Order(7)
    @DisplayName("GET /api/courses/{id} with non-existent ID returns 404")
    void getCourseByInvalidId() {
        asUser()
            .when()
            .get("/api/courses/00000000-0000-0000-0000-000000000000")
        .then()
            .statusCode(anyOf(is(404), is(400)));
    }

    // ── TC-C07: Admin deletes course ─────────────────────────────────────
    @Test
    @Order(8)
    @DisplayName("DELETE /api/courses/{id} removes the course")
    void adminDeletesCourse() {
        Assumptions.assumeTrue(createdCourseId != null, "Course creation must have succeeded");

        asAdmin()
            .when()
            .delete("/api/courses/" + createdCourseId)
        .then()
            .statusCode(200);

        // Verify deletion
        asAdmin()
            .when()
            .get("/api/courses/" + createdCourseId)
        .then()
            .statusCode(anyOf(is(404), is(400)));
    }
}
