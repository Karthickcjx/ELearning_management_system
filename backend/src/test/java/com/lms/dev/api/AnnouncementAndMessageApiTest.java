package com.lms.dev.api;

import io.restassured.response.Response;
import org.junit.jupiter.api.*;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * Announcement & Message API Tests
 * TC-ADM05, TC-ADM06, TC-ADM07
 */
@DisplayName("Announcement & Message API Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AnnouncementAndMessageApiTest extends BaseApiTest {

    private static String createdAnnouncementId;

    // ── TC-ADM06: Admin creates announcement ──────────────────────────────
    @Test
    @Order(1)
    @DisplayName("POST /api/announcements creates announcement as admin")
    void adminCreatesAnnouncement() {
        Response res = asAdmin()
            .body("{\"title\":\"REST Assured Test\",\"content\":\"Automated test announcement\"}")
            .when()
            .post("/api/announcements");

        res.then()
            .statusCode(200)
            .body("data.id", notNullValue())
            .body("data.title", equalTo("REST Assured Test"));

        createdAnnouncementId = res.jsonPath().getString("data.id");
    }

    // ── User cannot create announcement ───────────────────────────────────
    @Test
    @Order(2)
    @DisplayName("POST /api/announcements returns 403 for regular user")
    void userCannotCreateAnnouncement() {
        asUser()
            .body("{\"title\":\"Hacked\",\"content\":\"Should fail\"}")
            .when()
            .post("/api/announcements")
        .then()
            .statusCode(403);
    }

    // ── TC-ADM07: Toggle publish ──────────────────────────────────────────
    @Test
    @Order(3)
    @DisplayName("PUT /api/announcements/{id}/toggle-publish changes publish state")
    void adminTogglesAnnouncementPublish() {
        Assumptions.assumeTrue(createdAnnouncementId != null);

        asAdmin()
            .when()
            .put("/api/announcements/" + createdAnnouncementId + "/toggle-publish")
        .then()
            .statusCode(200);
    }

    // ── Published announcements visible to all ────────────────────────────
    @Test
    @Order(4)
    @DisplayName("GET /api/announcements/published returns published list")
    void getPublishedAnnouncements() {
        asAnonymous()
            .when()
            .get("/api/announcements/published")
        .then()
            .statusCode(200)
            .body("data", notNullValue());
    }

    // ── Admin gets all announcements ──────────────────────────────────────
    @Test
    @Order(5)
    @DisplayName("GET /api/announcements returns all for admin")
    void adminGetsAllAnnouncements() {
        asAdmin()
            .when()
            .get("/api/announcements")
        .then()
            .statusCode(200)
            .body("data", notNullValue());
    }

    // ── Cleanup: delete test announcement ─────────────────────────────────
    @Test
    @Order(6)
    @DisplayName("DELETE /api/announcements/{id} removes the announcement")
    void deleteAnnouncement() {
        Assumptions.assumeTrue(createdAnnouncementId != null);

        asAdmin()
            .when()
            .delete("/api/announcements/" + createdAnnouncementId)
        .then()
            .statusCode(200);
    }

    // ── TC-ADM05: Admin broadcasts message ───────────────────────────────
    @Test
    @DisplayName("POST /api/messages/broadcast sends to all users")
    void adminBroadcastsMessage() {
        asAdmin()
            .body("{\"content\":\"QA broadcast test — please ignore\"}")
            .when()
            .post("/api/messages/broadcast")
        .then()
            .statusCode(200);
    }

    // ── User cannot broadcast ─────────────────────────────────────────────
    @Test
    @DisplayName("POST /api/messages/broadcast returns 403 for regular user")
    void userCannotBroadcast() {
        asUser()
            .body("{\"content\":\"Should not work\"}")
            .when()
            .post("/api/messages/broadcast")
        .then()
            .statusCode(403);
    }

    // ── Get inbox ─────────────────────────────────────────────────────────
    @Test
    @DisplayName("GET /api/messages/inbox/{userId} returns user inbox")
    void getUserInbox() {
        Assumptions.assumeTrue(userId != null);

        asUser()
            .when()
            .get("/api/messages/inbox/" + userId)
        .then()
            .statusCode(200)
            .body("data", notNullValue());
    }
}
