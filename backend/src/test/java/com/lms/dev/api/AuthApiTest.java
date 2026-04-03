package com.lms.dev.api;

import io.restassured.response.Response;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * Auth API Tests — covers /api/auth/* endpoints
 * TC-A01, TC-A03, TC-A10, TC-A12, API contract validation
 */
@DisplayName("Auth API Tests")
class AuthApiTest extends BaseApiTest {

    // ── TC-A01: Valid login returns JWT ────────────────────────────────────
    @Test
    @DisplayName("POST /api/auth/login with valid credentials returns 200 and JWT")
    void loginWithValidCredentials() {
        given()
            .contentType("application/json")
            .body(loginBody(USER_EMAIL, USER_PASSWORD))
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .body("data.token", notNullValue())
            .body("data.email", equalTo(USER_EMAIL))
            .body("data.role", notNullValue())
            .body("message", notNullValue())
            .body("timestamp", notNullValue());
    }

    // ── TC-A03: Wrong password → 401 ──────────────────────────────────────
    @Test
    @DisplayName("POST /api/auth/login with wrong password returns 401")
    void loginWithWrongPassword() {
        given()
            .contentType("application/json")
            .body(loginBody(USER_EMAIL, "wrongPassword999"))
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(401);
    }

    // ── TC-A02: Missing email field → 400 ─────────────────────────────────
    @Test
    @DisplayName("POST /api/auth/login without email body field returns 4xx")
    void loginWithMissingEmail() {
        given()
            .contentType("application/json")
            .body("{\"password\":\"somepass\"}")
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(anyOf(is(400), is(401), is(422)));
    }

    // ── Non-existent user → 401/404 ────────────────────────────────────────
    @Test
    @DisplayName("POST /api/auth/login with non-existent email returns 401 or 404")
    void loginWithNonExistentUser() {
        given()
            .contentType("application/json")
            .body(loginBody("nobody_" + System.currentTimeMillis() + "@example.com", "pass123"))
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(anyOf(is(401), is(404)));
    }

    // ── TC-A10: OTP send to non-existent email → 404 ──────────────────────
    @Test
    @DisplayName("POST /api/auth/send-otp with unknown email returns 404")
    void sendOtpForNonExistentEmail() {
        given()
            .contentType("application/json")
            .body("{\"email\":\"nonexistent_" + System.currentTimeMillis() + "@example.com\"}")
        .when()
            .post("/api/auth/send-otp")
        .then()
            .statusCode(anyOf(is(404), is(400)));
    }

    // ── TC-A12: Reset password with invalid OTP → 400 ──────────────────────
    @Test
    @DisplayName("POST /api/auth/reset-password with invalid OTP returns 400")
    void resetPasswordWithInvalidOtp() {
        given()
            .contentType("application/json")
            .body(String.format(
                "{\"email\":\"%s\",\"otp\":\"000000\",\"newPassword\":\"NewPass@123\"}", USER_EMAIL
            ))
        .when()
            .post("/api/auth/reset-password")
        .then()
            .statusCode(400)
            .body("message", containsStringIgnoringCase("invalid"));
    }

    // ── TC-A14: Protected endpoint without token → 401 ────────────────────
    @Test
    @DisplayName("GET /api/users without Authorization header returns 401")
    void accessProtectedEndpointWithoutToken() {
        asAnonymous()
            .when()
            .get("/api/users")
        .then()
            .statusCode(401);
    }

    // ── Admin login returns ROLE_ADMIN ─────────────────────────────────────
    @Test
    @DisplayName("Admin login returns ROLE_ADMIN in response")
    void adminLoginReturnsAdminRole() {
        given()
            .contentType("application/json")
            .body(loginBody(ADMIN_EMAIL, ADMIN_PASSWORD))
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .body("data.role", containsString("ADMIN"));
    }

    // ── Response structure contract ────────────────────────────────────────
    @Test
    @DisplayName("Login response contains message, data, and timestamp fields")
    void loginResponseStructureContract() {
        given()
            .contentType("application/json")
            .body(loginBody(USER_EMAIL, USER_PASSWORD))
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .body("$", hasKey("message"))
            .body("$", hasKey("data"))
            .body("$", hasKey("timestamp"))
            .body("data", hasKey("token"))
            .body("data", hasKey("id"))
            .body("data", hasKey("email"))
            .body("data", hasKey("role"));
    }
}
