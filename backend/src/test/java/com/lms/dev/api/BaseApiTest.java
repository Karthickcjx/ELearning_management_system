package com.lms.dev.api;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.TestInstance;

import static io.restassured.RestAssured.given;

/**
 * Base class for all API integration tests.
 * Requires the Spring Boot app to be running at localhost:8081.
 *
 * Run the app first:  mvn spring-boot:run
 * Then run tests:     mvn test -Dtest="*ApiTest"
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public abstract class BaseApiTest {

    protected static final String BASE_URL = "http://localhost:8081";

    // Test credentials — ensure these exist in the DB before running tests
    protected static final String USER_EMAIL    = "testuser_qa@example.com";
    protected static final String USER_PASSWORD = "TestPass@123";
    protected static final String ADMIN_EMAIL   = "admin@gmail.com";
    protected static final String ADMIN_PASSWORD = "admin123";

    protected String userToken;
    protected String adminToken;
    protected String userId;
    protected String adminId;

    @BeforeAll
    void setupTokens() {
        RestAssured.baseURI = BASE_URL;

        // Obtain user token
        Response userLogin = given()
                .contentType(ContentType.JSON)
                .body(loginBody(USER_EMAIL, USER_PASSWORD))
                .when()
                .post("/api/auth/login");

        if (userLogin.statusCode() == 200) {
            userToken = userLogin.jsonPath().getString("data.token");
            userId    = userLogin.jsonPath().getString("data.id");
        }

        // Obtain admin token
        Response adminLogin = given()
                .contentType(ContentType.JSON)
                .body(loginBody(ADMIN_EMAIL, ADMIN_PASSWORD))
                .when()
                .post("/api/auth/login");

        if (adminLogin.statusCode() == 200) {
            adminToken = adminLogin.jsonPath().getString("data.token");
            adminId    = adminLogin.jsonPath().getString("data.id");
        }
    }

    protected String loginBody(String email, String password) {
        return String.format("{\"email\":\"%s\",\"password\":\"%s\"}", email, password);
    }

    protected io.restassured.specification.RequestSpecification asUser() {
        return given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + userToken);
    }

    protected io.restassured.specification.RequestSpecification asAdmin() {
        return given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + adminToken);
    }

    protected io.restassured.specification.RequestSpecification asAnonymous() {
        return given().contentType(ContentType.JSON);
    }
}
