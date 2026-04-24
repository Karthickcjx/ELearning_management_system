package com.lms.dev.api;

import io.restassured.response.Response;
import org.junit.jupiter.api.*;

import java.io.File;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * User API Tests — covers /api/users/* endpoints
 * TC-P01–P05, TC-ADM03, TC-ADM09
 */
@DisplayName("User API Tests")
class UserApiTest extends BaseApiTest {

    // ── TC-ADM03: Admin gets all users ────────────────────────────────────
    @Test
    @DisplayName("GET /api/users returns all users for admin")
    void adminGetsAllUsers() {
        asAdmin()
            .when()
            .get("/api/users")
        .then()
            .statusCode(200)
            .body("data", not(nullValue()))
            .body("data.size()", greaterThan(0));
    }

    // ── User cannot list all users ────────────────────────────────────────
    @Test
    @DisplayName("GET /api/users returns 403 for regular user")
    void userCannotListAllUsers() {
        asUser()
            .when()
            .get("/api/users")
        .then()
            .statusCode(403);
    }

    // ── TC-P01: User gets own profile ─────────────────────────────────────
    @Test
    @DisplayName("GET /api/users/{id} returns own profile data")
    void userGetsOwnProfile() {
        Assumptions.assumeTrue(userId != null, "User login must succeed");

        asUser()
            .when()
            .get("/api/users/" + userId)
        .then()
            .statusCode(200)
            .body("data.id", equalTo(userId))
            .body("data.email", equalTo(USER_EMAIL));
    }

    @Test
    @DisplayName("GET /api/users/me returns authenticated user profile")
    void userGetsCurrentProfile() {
        Assumptions.assumeTrue(userId != null, "User login must succeed");

        asUser()
            .when()
            .get("/api/users/me")
        .then()
            .statusCode(200)
            .body("data.id", equalTo(userId))
            .body("data.email", equalTo(USER_EMAIL));
    }

    // ── TC-P05: User cannot edit another user's profile ───────────────────
    @Test
    @DisplayName("PUT /api/users/{otherId} returns 403 for different user")
    void userCannotEditAnotherUsersProfile() {
        Assumptions.assumeTrue(adminId != null && userId != null, "Both IDs must be available");

        // Attempt to update the admin's profile using user's token
        asUser()
            .body("{\"name\":\"Hacked Name\"}")
            .when()
            .put("/api/users/" + adminId)
        .then()
            .statusCode(403);
    }

    // ── TC-ADM09: User cannot delete another user ─────────────────────────
    @Test
    @DisplayName("DELETE /api/users/{otherId} returns 403 for regular user")
    void userCannotDeleteAnotherUser() {
        Assumptions.assumeTrue(adminId != null && userId != null, "Both IDs must be available");

        asUser()
            .when()
            .delete("/api/users/" + adminId)
        .then()
            .statusCode(403);
    }

    // ── Dashboard stats ───────────────────────────────────────────────────
    @Test
    @DisplayName("GET /api/users/{id}/dashboard-stats returns stats for own user")
    void userGetsDashboardStats() {
        Assumptions.assumeTrue(userId != null, "User login must succeed");

        asUser()
            .when()
            .get("/api/users/" + userId + "/dashboard-stats")
        .then()
            .statusCode(200)
            .body("data", notNullValue());
    }

    // ── Get user by email ─────────────────────────────────────────────────
    @Test
    @DisplayName("GET /api/users/details returns own user data")
    void userGetsOwnDetailsByEmail() {
        asUser()
            .queryParam("email", USER_EMAIL)
            .when()
            .get("/api/users/details")
        .then()
            .statusCode(200)
            .body("data.email", equalTo(USER_EMAIL));
    }

    // ── Unauthenticated access to user profile ────────────────────────────
    @Test
    @DisplayName("GET /api/users/{id} without token returns 401")
    void unauthenticatedCannotGetUserProfile() {
        Assumptions.assumeTrue(userId != null);

        asAnonymous()
            .when()
            .get("/api/users/" + userId)
        .then()
            .statusCode(401);
    }
}
