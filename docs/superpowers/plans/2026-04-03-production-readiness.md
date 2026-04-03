# Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the LMS app for production by closing security vulnerabilities, fixing silent service failures, standardising API response shapes, and making config deployable.

**Architecture:** All backend changes follow the existing pattern — services throw `ResponseStatusException`, controllers return `ResponseEntity<ApiResponse<T>>`, DTOs live in `com.lms.dev.dto`. Frontend only touches the API service layer (`course.service.js`, `constant.js`); no React components change.

**Tech Stack:** Spring Boot 3.2.1 · Java 17 · Lombok · Jakarta Validation · JUnit 5 · Mockito · React 18 · Axios

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `backend/pom.xml` | Modify | Add `spring-boot-starter-validation` |
| `backend/src/main/resources/application.yml` | Modify | Remove real secret fallbacks |
| `backend/.env.example` | **Create** | Document all required env vars |
| `backend/src/main/java/com/lms/dev/service/OtpService.java` | Modify | `SecureRandom` |
| `backend/src/main/java/com/lms/dev/dto/UpdateUserRequest.java` | **Create** | Safe user-update DTO (10 fields, no role/password) |
| `backend/src/main/java/com/lms/dev/dto/UserSummaryDTO.java` | **Create** | List projection — no BLOB, no collections |
| `backend/src/main/java/com/lms/dev/service/UserService.java` | Modify | Throw 404 instead of null; accept `UpdateUserRequest` |
| `backend/src/main/java/com/lms/dev/controller/UserController.java` | Modify | `ApiResponse<T>` wrappers; file validation; use new DTOs |
| `backend/src/main/java/com/lms/dev/service/CourseService.java` | Modify | Throw 404 instead of null |
| `backend/src/main/java/com/lms/dev/entity/Course.java` | Modify | `@NotBlank`, `@Min` validation annotations |
| `backend/src/main/java/com/lms/dev/controller/CourseController.java` | Modify | Constructor injection; `ApiResponse<T>`; `@Valid` |
| `backend/src/main/java/com/lms/dev/exception/GlobalExceptionHandler.java` | Modify | 4 new exception handlers |
| `backend/src/test/java/com/lms/dev/service/CourseServiceTest.java` | **Create** | Unit tests for CourseService null→404 |
| `backend/src/test/java/com/lms/dev/service/UserServiceTest.java` | **Create** | Unit tests for UserService null→404 + UpdateUserRequest |
| `frontend/src/api/constant.js` | Modify | Use `process.env.REACT_APP_API_URL` |
| `frontend/src/api/course.service.js` | Modify | Unwrap `response.data.data` for course endpoints |
| `frontend/.env` | **Create** | Local dev URL (gitignored) |
| `frontend/.env.example` | **Create** | Documented placeholder |

---

## Task 1: Add spring-boot-starter-validation to pom.xml

**Files:**
- Modify: `backend/pom.xml`

`@Valid` in Spring MVC controllers requires this starter. The `@NotBlank`/`@Min` annotation classes exist on the classpath via JPA/Hibernate, but the web-layer validation executor does not — it lives in this starter.

- [ ] **Step 1: Add the dependency**

Open `backend/pom.xml`. After the existing `spring-boot-starter-test` block, add:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

- [ ] **Step 2: Verify it resolves**

```bash
cd backend
mvn dependency:resolve -q
```

Expected: no errors, `BUILD SUCCESS`.

- [ ] **Step 3: Commit**

```bash
git add backend/pom.xml
git commit -m "build: add spring-boot-starter-validation for Bean Validation in MVC"
```

---

## Task 2: Harden application.yml — remove real secret fallbacks

**Files:**
- Modify: `backend/src/main/resources/application.yml`
- Create: `backend/.env.example`

The current file uses real credentials as default fallback values. Removing the fallbacks means the app will refuse to start if the env var is absent — which is the correct behavior for a production config.

- [ ] **Step 1: Replace the sensitive fallback values in application.yml**

Replace the entire `backend/src/main/resources/application.yml` with:

```yaml
server:
  port: 8081

spring:
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: ${DB_URL:jdbc:mysql://localhost:3306/lms?createDatabaseIfNotExist=true}
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD}

  mail:
    host: ${MAIL_HOST:smtp.gmail.com}
    port: ${MAIL_PORT:587}
    username: ${MAIL_USERNAME:eduverce3@gmail.com}
    password: ${MAIL_PASSWORD}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true

  jpa:
    generate-ddl: true
    show-sql: false
    properties:
      hibernate:
        transaction:
          jta:
            platform: org.hibernate.engine.transaction.jta.platform.internal.NoJtaPlatform

  mvc:
    throw-exception-if-no-handler-found: true
  web:
    resources:
      add-mappings: false

app:
  jwtSecret: ${JWT_SECRET}
  jwtExpirationMs: ${JWT_EXPIRATION:86400000}
  default-admin:
    enabled: ${ADMIN_BOOTSTRAP_ENABLED:false}
    username: ${ADMIN_USERNAME:admin}
    password: ${ADMIN_PASSWORD}
    email: ${ADMIN_EMAIL:admin@lms.local}

  cohere:
    api-key: ${COHERE_API_KEY}

  ai:
    model-version: ${AI_MODEL_VERSION:command-r7b-12-2024}
    websocket:
      allowed-origins: ${AI_WS_ALLOWED_ORIGINS:http://localhost:3000,http://127.0.0.1:3000}
    rate-limit:
      requests-per-minute: ${AI_RATE_LIMIT_PER_MINUTE:30}
    async:
      core-pool-size: ${AI_ASYNC_CORE_POOL_SIZE:16}
      max-pool-size: ${AI_ASYNC_MAX_POOL_SIZE:64}
      queue-capacity: ${AI_ASYNC_QUEUE_CAPACITY:500}

  rooms:
    websocket:
      allowed-origins: ${ROOM_WS_ALLOWED_ORIGINS:http://localhost:3000,http://127.0.0.1:3000}
    matching:
      group-size: ${ROOM_MATCH_GROUP_SIZE:3}
      max-band-distance: ${ROOM_MATCH_MAX_BAND_DISTANCE:1}
    ai-moderator:
      enabled: ${ROOM_AI_MODERATOR_ENABLED:true}

logging:
  level:
    com.lms.dev: ${APP_LOG_LEVEL:INFO}
    org.springframework.security: ${SECURITY_LOG_LEVEL:INFO}
```

- [ ] **Step 2: Create backend/.env.example**

Create `backend/.env.example`:

```bash
# ── Database ────────────────────────────────────────────────────────────────
# Full JDBC URL. createDatabaseIfNotExist=true is convenient for local dev.
DB_URL=jdbc:mysql://localhost:3306/lms?createDatabaseIfNotExist=true
DB_USERNAME=root
DB_PASSWORD=your_mysql_password_here

# ── JWT ─────────────────────────────────────────────────────────────────────
# Must be at least 64 characters for HS512. Generate with:
#   openssl rand -base64 64
JWT_SECRET=replace-with-a-random-64-plus-character-string-do-not-use-this-value
# Token lifetime in milliseconds. 86400000 = 24 hours.
JWT_EXPIRATION=86400000

# ── Email (Gmail SMTP) ───────────────────────────────────────────────────────
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-gmail@gmail.com
# Use a Gmail App Password (not your account password).
# Generate at: https://myaccount.google.com/apppasswords
MAIL_PASSWORD=xxxx xxxx xxxx xxxx

# ── AI (Cohere) ──────────────────────────────────────────────────────────────
# Get your key at: https://dashboard.cohere.com/api-keys
COHERE_API_KEY=your-cohere-api-key-here
AI_MODEL_VERSION=command-r7b-12-2024

# ── Admin bootstrap (leave ADMIN_BOOTSTRAP_ENABLED=false in production) ──────
ADMIN_BOOTSTRAP_ENABLED=false
ADMIN_USERNAME=admin
ADMIN_PASSWORD=choose-a-strong-password
ADMIN_EMAIL=admin@yourdomain.com
```

- [ ] **Step 3: Verify the app still starts with env vars exported**

Export the minimum required vars in your terminal (use your real local values):
```bash
export DB_PASSWORD=your_local_mysql_password
export JWT_SECRET=local-dev-jwt-secret-at-least-64-characters-long-padding-here
export MAIL_PASSWORD=your_app_password
export COHERE_API_KEY=your_key
export ADMIN_PASSWORD=admin123
```
Then run: `mvn spring-boot:run -pl backend`
Expected: Spring context starts, no `IllegalArgumentException` about missing properties.

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/resources/application.yml backend/.env.example
git commit -m "security: remove hardcoded secret fallbacks from application.yml"
```

---

## Task 3: Fix OtpService — SecureRandom

**Files:**
- Modify: `backend/src/main/java/com/lms/dev/service/OtpService.java`

`java.util.Random` is seeded from the system clock and is not cryptographically secure. `java.security.SecureRandom` uses the OS entropy pool and is appropriate for security-sensitive values like OTPs.

- [ ] **Step 1: Replace Random with SecureRandom**

Open `OtpService.java`. Change:

```java
// REMOVE this import if present (java.util.Random is implicit via java.util.*)
String otp = String.format("%06d", new Random().nextInt(1000000));
```

To:

```java
String otp = String.format("%06d", new SecureRandom().nextInt(1000000));
```

Add import at the top of the file:
```java
import java.security.SecureRandom;
```

Remove the `java.util.Random` import if it exists (it may have been a wildcard import).

The complete updated `generateAndSendOtp` method:

```java
public void generateAndSendOtp(String email) {
    Optional<EmailOtp> existingOtpOpt = emailOtpRepository.findByEmail(email);
    EmailOtp otpEntity;

    if (existingOtpOpt.isPresent()) {
        otpEntity = existingOtpOpt.get();
        if (otpEntity.getAttempts() >= 5 && otpEntity.getExpiryTime().isAfter(LocalDateTime.now())) {
            throw new RuntimeException("Maximum OTP resend attempts reached. Please try again later.");
        }
    } else {
        otpEntity = EmailOtp.builder().email(email).build();
    }

    String otp = String.format("%06d", new SecureRandom().nextInt(1000000));

    log.info("Generated new OTP for email: {}", email);

    otpEntity.setOtpCode(otp);
    otpEntity.setExpiryTime(LocalDateTime.now().plusMinutes(5));
    otpEntity.setVerified(false);
    otpEntity.setAttempts(otpEntity.getAttempts() + 1);

    emailOtpRepository.save(otpEntity);
    emailService.sendOtpEmail(email, otp);
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd backend && mvn compile -q
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/com/lms/dev/service/OtpService.java
git commit -m "security: replace Random with SecureRandom in OtpService"
```

---

## Task 4: Create UpdateUserRequest DTO

**Files:**
- Create: `backend/src/main/java/com/lms/dev/dto/UpdateUserRequest.java`

This DTO is a plain data carrier — no logic. It defines the exact fields a user may update. `role`, `email`, `password`, `isActive`, and `profileImage` are intentionally absent.

- [ ] **Step 1: Create the file**

```java
package com.lms.dev.dto;

import lombok.Data;

@Data
public class UpdateUserRequest {
    private String username;
    private String dob;
    private String mobileNumber;
    private String gender;
    private String location;
    private String profession;
    private String linkedin_url;
    private String github_url;
    private String occupation;
    private String learningField;
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd backend && mvn compile -q
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/com/lms/dev/dto/UpdateUserRequest.java
git commit -m "feat: add UpdateUserRequest DTO to prevent role escalation on user update"
```

---

## Task 5: Create UserSummaryDTO

**Files:**
- Create: `backend/src/main/java/com/lms/dev/dto/UserSummaryDTO.java`

Used exclusively by `getAllUsers()` to return a lightweight projection. The `LONGBLOB` `profileImage` and `learningCourses` collection are excluded.

- [ ] **Step 1: Create the file**

```java
package com.lms.dev.dto;

import com.lms.dev.entity.User;
import com.lms.dev.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
public class UserSummaryDTO {
    private UUID id;
    private String username;
    private String email;
    private UserRole role;
    private Boolean isActive;
    private LocalDateTime createdAt;

    public static UserSummaryDTO from(User user) {
        return new UserSummaryDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user.getIsActive(),
                user.getCreatedAt()
        );
    }
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd backend && mvn compile -q
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/com/lms/dev/dto/UserSummaryDTO.java
git commit -m "feat: add UserSummaryDTO to exclude BLOB from user list responses"
```

---

## Task 6: Fix CourseService — throw 404 instead of null

**Files:**
- Create: `backend/src/test/java/com/lms/dev/service/CourseServiceTest.java`
- Modify: `backend/src/main/java/com/lms/dev/service/CourseService.java`

- [ ] **Step 1: Write the failing tests**

Create `backend/src/test/java/com/lms/dev/service/CourseServiceTest.java`:

```java
package com.lms.dev.service;

import com.lms.dev.entity.Course;
import com.lms.dev.repository.CourseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CourseServiceTest {

    @Mock
    private CourseRepository courseRepository;

    @InjectMocks
    private CourseService courseService;

    private UUID knownId;
    private UUID unknownId;
    private Course course;

    @BeforeEach
    void setUp() {
        knownId = UUID.randomUUID();
        unknownId = UUID.randomUUID();
        course = new Course();
        course.setCourse_id(knownId);
        course.setCourse_name("Test Course");
        course.setInstructor("Instructor");
        course.setPrice(0);
    }

    @Test
    void getCourseById_whenExists_returnsCourse() {
        when(courseRepository.findById(knownId)).thenReturn(Optional.of(course));
        Course result = courseService.getCourseById(knownId);
        assertThat(result.getCourse_id()).isEqualTo(knownId);
    }

    @Test
    void getCourseById_whenNotFound_throws404() {
        when(courseRepository.findById(unknownId)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> courseService.getCourseById(unknownId))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void updateCourse_whenNotFound_throws404() {
        when(courseRepository.findById(unknownId)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> courseService.updateCourse(unknownId, new Course()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.NOT_FOUND));
    }
}
```

- [ ] **Step 2: Run the tests — expect FAIL**

```bash
cd backend && mvn test -Dtest="CourseServiceTest" -q
```

Expected: `Tests run: 3, Failures: 0, Errors: 2` — the two 404 tests fail because the service currently returns `null`.

- [ ] **Step 3: Update CourseService.java**

Replace the full contents of `backend/src/main/java/com/lms/dev/service/CourseService.java`:

```java
package com.lms.dev.service;

import com.lms.dev.entity.Course;
import com.lms.dev.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class CourseService {

    private final CourseRepository courseRepository;

    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    public Course getCourseById(UUID id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
    }

    public Course createCourse(Course course) {
        return courseRepository.save(course);
    }

    public Course updateCourse(UUID id, Course updatedCourse) {
        Course existing = courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        existing.setCourse_name(updatedCourse.getCourse_name());
        existing.setDescription(updatedCourse.getDescription());
        existing.setP_link(updatedCourse.getP_link());
        existing.setPrice(updatedCourse.getPrice());
        existing.setInstructor(updatedCourse.getInstructor());
        existing.setY_link(updatedCourse.getY_link());
        return courseRepository.save(existing);
    }

    public void deleteCourse(UUID id) {
        courseRepository.deleteById(id);
    }
}
```

- [ ] **Step 4: Run the tests — expect PASS**

```bash
cd backend && mvn test -Dtest="CourseServiceTest" -q
```

Expected: `Tests run: 3, Failures: 0, Errors: 0, Skipped: 0`.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/lms/dev/service/CourseService.java \
        backend/src/test/java/com/lms/dev/service/CourseServiceTest.java
git commit -m "fix: CourseService throws 404 instead of returning null for missing courses"
```

---

## Task 7: Add validation annotations to Course entity

**Files:**
- Modify: `backend/src/main/java/com/lms/dev/entity/Course.java`

These annotations define the constraints that `@Valid` in the controller will enforce.

- [ ] **Step 1: Add validation annotations to Course.java**

Replace the full contents of `backend/src/main/java/com/lms/dev/entity/Course.java`:

```java
package com.lms.dev.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

import java.util.List;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Course {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "course_id", updatable = false, nullable = false, columnDefinition = "BINARY(16)")
    private UUID course_id;

    @NotBlank(message = "Course name is required")
    @JsonProperty("course_name")
    private String course_name;

    @Min(value = 0, message = "Price cannot be negative")
    private int price;

    @NotBlank(message = "Instructor name is required")
    private String instructor;

    private String description;

    private String p_link;

    private String y_link;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Feedback> feedbacks;

    @OneToMany(mappedBy = "course")
    @JsonIgnore
    private List<Questions> questions;
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd backend && mvn compile -q
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/com/lms/dev/entity/Course.java
git commit -m "feat: add Bean Validation constraints to Course entity"
```

---

## Task 8: Rewrite CourseController — ApiResponse<T>, constructor injection, @Valid

**Files:**
- Modify: `backend/src/main/java/com/lms/dev/controller/CourseController.java`

- [ ] **Step 1: Replace CourseController.java**

```java
package com.lms.dev.controller;

import com.lms.dev.dto.ApiResponse;
import com.lms.dev.entity.Course;
import com.lms.dev.service.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Course>>> getAllCourses() {
        List<Course> courses = courseService.getAllCourses();
        return ResponseEntity.ok(new ApiResponse<>("Courses retrieved successfully", courses));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Course>> getCourseById(@PathVariable UUID id) {
        Course course = courseService.getCourseById(id);
        return ResponseEntity.ok(new ApiResponse<>("Course retrieved successfully", course));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<Course>> createCourse(@Valid @RequestBody Course course) {
        Course created = courseService.createCourse(course);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>("Course created successfully", created));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Course>> updateCourse(
            @PathVariable UUID id,
            @Valid @RequestBody Course updatedCourse) {
        Course updated = courseService.updateCourse(id, updatedCourse);
        return ResponseEntity.ok(new ApiResponse<>("Course updated successfully", updated));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(@PathVariable UUID id) {
        courseService.deleteCourse(id);
        return ResponseEntity.ok(new ApiResponse<>("Course deleted successfully", null));
    }
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd backend && mvn compile -q
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 3: Run existing course service tests to make sure nothing broke**

```bash
cd backend && mvn test -Dtest="CourseServiceTest" -q
```

Expected: `Tests run: 3, Failures: 0, Errors: 0`.

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/lms/dev/controller/CourseController.java
git commit -m "feat: wrap CourseController responses in ApiResponse<T>, add @Valid, constructor injection"
```

---

## Task 9: Fix UserService — throw 404 + accept UpdateUserRequest

**Files:**
- Create: `backend/src/test/java/com/lms/dev/service/UserServiceTest.java`
- Modify: `backend/src/main/java/com/lms/dev/service/UserService.java`

- [ ] **Step 1: Write the failing tests**

Create `backend/src/test/java/com/lms/dev/service/UserServiceTest.java`:

```java
package com.lms.dev.service;

import com.lms.dev.dto.UpdateUserRequest;
import com.lms.dev.entity.User;
import com.lms.dev.enums.UserRole;
import com.lms.dev.repository.ProgressRepository;
import com.lms.dev.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private ProgressRepository progressRepository;

    @InjectMocks
    private UserService userService;

    private UUID knownId;
    private UUID unknownId;
    private User existingUser;

    @BeforeEach
    void setUp() {
        knownId = UUID.randomUUID();
        unknownId = UUID.randomUUID();
        existingUser = User.builder()
                .id(knownId)
                .username("original")
                .email("user@test.com")
                .password("encoded")
                .role(UserRole.USER)
                .isActive(true)
                .build();
    }

    @Test
    void getUserById_whenExists_returnsUser() {
        when(userRepository.findById(knownId)).thenReturn(Optional.of(existingUser));
        User result = userService.getUserById(knownId);
        assertThat(result.getId()).isEqualTo(knownId);
    }

    @Test
    void getUserById_whenNotFound_throws404() {
        when(userRepository.findById(unknownId)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> userService.getUserById(unknownId))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void updateUser_whenNotFound_throws404() {
        when(userRepository.findById(unknownId)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> userService.updateUser(unknownId, new UpdateUserRequest()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void updateUser_cannotChangeRole() {
        when(userRepository.findById(knownId)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserRequest req = new UpdateUserRequest();
        req.setUsername("newname");

        User result = userService.updateUser(knownId, req);

        // Role must stay USER regardless of what the caller sends
        assertThat(result.getRole()).isEqualTo(UserRole.USER);
        assertThat(result.getUsername()).isEqualTo("newname");
    }
}
```

- [ ] **Step 2: Run the tests — expect FAIL**

```bash
cd backend && mvn test -Dtest="UserServiceTest" -q
```

Expected: compile error or failures — `updateUser` currently takes `User`, not `UpdateUserRequest`.

- [ ] **Step 3: Update UserService.java**

Replace the full contents of `backend/src/main/java/com/lms/dev/service/UserService.java`:

```java
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
```

- [ ] **Step 4: Run the tests — expect PASS**

```bash
cd backend && mvn test -Dtest="UserServiceTest" -q
```

Expected: `Tests run: 4, Failures: 0, Errors: 0, Skipped: 0`.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/lms/dev/service/UserService.java \
        backend/src/test/java/com/lms/dev/service/UserServiceTest.java
git commit -m "fix: UserService throws 404 for missing users; updateUser accepts UpdateUserRequest only"
```

---

## Task 10: Rewrite UserController — ApiResponse<T>, file validation, new DTOs

**Files:**
- Modify: `backend/src/main/java/com/lms/dev/controller/UserController.java`

- [ ] **Step 1: Replace UserController.java**

```java
package com.lms.dev.controller;

import com.lms.dev.dto.ApiResponse;
import com.lms.dev.dto.UpdateUserRequest;
import com.lms.dev.dto.UserSummaryDTO;
import com.lms.dev.entity.User;
import com.lms.dev.security.SecurityAccessService;
import com.lms.dev.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final SecurityAccessService securityAccessService;

    private static final List<String> ALLOWED_IMAGE_TYPES =
            List.of("image/jpeg", "image/png", "image/webp", "image/gif");
    private static final long MAX_IMAGE_SIZE = 2L * 1024 * 1024; // 2 MB

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserSummaryDTO>>> getAllUsers() {
        List<UserSummaryDTO> users = userService.getAllUsers()
                .stream()
                .map(UserSummaryDTO::from)
                .toList();
        return ResponseEntity.ok(new ApiResponse<>("Users retrieved successfully", users));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<User>> getUserById(
            @PathVariable UUID id, Authentication authentication) {
        securityAccessService.assertSelfOrAdmin(authentication, id);
        User user = userService.getUserById(id);
        return ResponseEntity.ok(new ApiResponse<>("User retrieved successfully", user));
    }

    @GetMapping("/{id}/profile-image")
    public ResponseEntity<byte[]> getProfileImage(
            @PathVariable UUID id, Authentication authentication) {
        securityAccessService.assertSelfOrAdmin(authentication, id);
        User user = userService.getUserById(id);
        if (user.getProfileImage() == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .header("Content-Type", "image/jpeg")
                .body(user.getProfileImage());
    }

    @PostMapping("/{id}/upload-image")
    public ResponseEntity<ApiResponse<Void>> uploadProfileImage(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        securityAccessService.assertSelfOrAdmin(authentication, id);

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>("Only JPEG, PNG, WebP, or GIF images are allowed", null));
        }
        if (file.getSize() > MAX_IMAGE_SIZE) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>("File size must not exceed 2 MB", null));
        }

        try {
            userService.updateUserProfile(file, id);
            return ResponseEntity.ok(new ApiResponse<>("Image uploaded successfully", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>("Error uploading image", null));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<User>> updateUser(
            @PathVariable UUID id,
            @RequestBody UpdateUserRequest request,
            Authentication authentication) {
        securityAccessService.assertSelfOrAdmin(authentication, id);
        User updated = userService.updateUser(id, request);
        return ResponseEntity.ok(new ApiResponse<>("User updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable UUID id, Authentication authentication) {
        securityAccessService.assertSelfOrAdmin(authentication, id);
        userService.deleteUser(id);
        return ResponseEntity.ok(new ApiResponse<>("User deleted successfully", null));
    }

    @GetMapping("/details")
    public ResponseEntity<ApiResponse<User>> getUserByEmail(
            @RequestParam String email, Authentication authentication) {
        securityAccessService.assertEmailAccess(authentication, email);
        User user = userService.getUserByEmail(email);
        return ResponseEntity.ok(new ApiResponse<>("User retrieved successfully", user));
    }

    @GetMapping("/{id}/dashboard-stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats(
            @PathVariable UUID id, Authentication authentication) {
        securityAccessService.assertSelfOrAdmin(authentication, id);
        Map<String, Object> stats = userService.getUserDashboardStats(id);
        return ResponseEntity.ok(new ApiResponse<>("Dashboard stats retrieved", stats));
    }
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd backend && mvn compile -q
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 3: Run all service tests**

```bash
cd backend && mvn test -Dtest="CourseServiceTest,UserServiceTest" -q
```

Expected: `Tests run: 7, Failures: 0, Errors: 0`.

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/lms/dev/controller/UserController.java
git commit -m "feat: wrap UserController in ApiResponse<T>; add file validation; use UpdateUserRequest and UserSummaryDTO"
```

---

## Task 11: Expand GlobalExceptionHandler

**Files:**
- Modify: `backend/src/main/java/com/lms/dev/exception/GlobalExceptionHandler.java`

- [ ] **Step 1: Replace GlobalExceptionHandler.java**

```java
package com.lms.dev.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(
            HttpServletRequest request,
            MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fe.getField(), fe.getDefaultMessage());
        }
        Map<String, Object> body = new HashMap<>();
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Validation Failed");
        body.put("fieldErrors", fieldErrors);
        body.put("path", request.getRequestURI());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(
            HttpServletRequest request,
            AccessDeniedException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", HttpStatus.FORBIDDEN.value());
        body.put("error", "Forbidden");
        body.put("message", "You do not have permission to perform this action");
        body.put("path", request.getRequestURI());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(
            HttpServletRequest request,
            ResponseStatusException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", ex.getStatusCode().value());
        body.put("error", ex.getStatusCode().toString());
        body.put("message", ex.getReason());
        body.put("path", request.getRequestURI());
        return ResponseEntity.status(ex.getStatusCode()).body(body);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleMethodNotSupported(
            HttpServletRequest request,
            HttpRequestMethodNotSupportedException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", HttpStatus.METHOD_NOT_ALLOWED.value());
        body.put("error", "Method Not Allowed");
        body.put("message", ex.getMessage());
        body.put("path", request.getRequestURI());
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(body);
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(
            HttpServletRequest request,
            NoHandlerFoundException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", HttpStatus.NOT_FOUND.value());
        body.put("error", "Not Found");
        body.put("message", "The requested URL was not found on the server");
        body.put("path", request.getRequestURI());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(
            HttpServletRequest request,
            IllegalArgumentException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Bad Request");
        body.put("message", ex.getMessage());
        body.put("path", request.getRequestURI());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(
            HttpServletRequest request,
            Exception ex) {
        log.error("Unhandled exception at {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        Map<String, Object> body = new HashMap<>();
        body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        body.put("error", "Internal Server Error");
        body.put("message", "An unexpected error occurred");
        body.put("path", request.getRequestURI());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd backend && mvn compile -q
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 3: Run all service tests one final time**

```bash
cd backend && mvn test -Dtest="CourseServiceTest,UserServiceTest" -q
```

Expected: `Tests run: 7, Failures: 0, Errors: 0`.

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/lms/dev/exception/GlobalExceptionHandler.java
git commit -m "fix: expand GlobalExceptionHandler — add validation, access denied, ResponseStatus, and catch-all handlers"
```

---

## Task 12: Update frontend constant.js — env variable

**Files:**
- Modify: `frontend/src/api/constant.js`

- [ ] **Step 1: Update constant.js**

Replace the entire contents of `frontend/src/api/constant.js`:

```js
export const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8081";
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/api/constant.js
git commit -m "config: read API base URL from REACT_APP_API_URL env variable"
```

---

## Task 13: Update course.service.js — unwrap ApiResponse wrapper

**Files:**
- Modify: `frontend/src/api/course.service.js`

`getAllCourses` and `getCourseById` now receive `{ message, data, timestamp }` from the backend instead of raw course objects. The other methods (`getFeedbacks`, `postFeedback`, `getMessages`, `addMessage`) call feedback/discussion endpoints — those are unchanged.

- [ ] **Step 1: Update the two course methods in course.service.js**

Replace the full contents of `frontend/src/api/course.service.js`:

```js
import api from "./api";

async function getAllCourses() {
  try {
    const { data } = await api.get("/api/courses");
    // data is ApiResponse<List<Course>> — unwrap the .data field
    return { success: true, data: data.data };
  } catch (error) {
    console.error("Error fetching courses:", error);
    return { success: false, error: "Could not fetch courses" };
  }
}

async function getCourseById(courseId) {
  try {
    const { data } = await api.get(`/api/courses/${courseId}`);
    // data is ApiResponse<Course> — unwrap the .data field
    return { success: true, data: data.data };
  } catch (error) {
    console.error("Error fetching course:", error);
    return { success: false, error: "Could not fetch course details" };
  }
}

async function getFeedbacks(courseId) {
  try {
    const { data } = await api.get(`/api/feedbacks/${courseId}`);
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    return { success: false, error: "Unable to fetch feedbacks" };
  }
}

async function postFeedback(courseId, comment) {
  try {
    await api.post("/api/feedbacks", { comment, course_id: courseId });
    return { success: true };
  } catch (error) {
    console.error("Error posting feedback:", error);
    return { success: false, error: "Unable to post feedback" };
  }
}

async function getMessages(courseId) {
  try {
    const { data } = await api.get(`/api/discussions/${courseId}`);
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching messages:", error);
    return { success: false, error: "Unable to fetch messages" };
  }
}

async function addMessage(formData) {
  try {
    const { data } = await api.post("/api/discussions/addMessage", formData);
    return { success: true, data };
  } catch (error) {
    console.error("Error adding message:", error);
    return { success: false, error: "Unable to add message" };
  }
}

export const courseService = {
  getAllCourses,
  getCourseById,
  getFeedbacks,
  postFeedback,
  getMessages,
  addMessage,
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/api/course.service.js
git commit -m "fix: unwrap ApiResponse wrapper in course.service.js getAllCourses and getCourseById"
```

---

## Task 14: Create .env files

**Files:**
- Create: `frontend/.env`
- Create: `frontend/.env.example`

- [ ] **Step 1: Create frontend/.env (gitignored)**

Create `frontend/.env`:

```
REACT_APP_API_URL=http://localhost:8081
```

Verify `.gitignore` already covers it — the root `.gitignore` has `.env` listed. Confirm:

```bash
grep "\.env" "D:/reeee lms/ELearning_management_system/.gitignore"
```

Expected: `.env` appears in the output.

- [ ] **Step 2: Create frontend/.env.example**

Create `frontend/.env.example`:

```
# URL of the Spring Boot backend API
# Change this for staging/production deployments
REACT_APP_API_URL=http://your-backend-url:8081
```

- [ ] **Step 3: Commit only .env.example (not .env)**

```bash
git add frontend/.env.example
git commit -m "config: add frontend .env.example documenting REACT_APP_API_URL"
```

---

## Task 15: Final verification

- [ ] **Step 1: Run all backend tests**

```bash
cd backend && mvn test -q
```

Expected: All tests pass, `BUILD SUCCESS`.

- [ ] **Step 2: Build the backend**

```bash
cd backend && mvn clean package -DskipTests -q
```

Expected: `BUILD SUCCESS`, jar created in `target/`.

- [ ] **Step 3: Build the frontend**

```bash
cd frontend && npm run build 2>&1 | tail -5
```

Expected: `Compiled successfully` or `webpack compiled successfully`.

- [ ] **Step 4: Smoke-test the running app**

Start the backend (with env vars set), then:

```bash
# Login — expect {"message":"Login successful","data":{"token":"...",...},"timestamp":"..."}
curl -s -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lms.local","password":"your_admin_password"}' | python -m json.tool

# Courses — expect {"message":"Courses retrieved successfully","data":[...],"timestamp":"..."}
TOKEN=$(curl -s -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lms.local","password":"your_admin_password"}' | python -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

curl -s http://localhost:8081/api/courses \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool

# Role escalation blocked — expect 400 or update succeeds but role unchanged
curl -s -X PUT http://localhost:8081/api/users/<your-user-id> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"hacker","role":"ROLE_ADMIN"}' | python -m json.tool
```

- [ ] **Step 5: Final commit (if any files unstaged)**

```bash
git status
# Stage any remaining untracked files, then:
git add -A
git commit -m "chore: production readiness — security hardening and API correctness complete"
```

---

## Spec Coverage Checklist

| Spec Requirement | Task |
|-----------------|------|
| Remove hardcoded secret fallbacks from application.yml | Task 2 |
| Create backend/.env.example | Task 2 |
| OtpService SecureRandom | Task 3 |
| UpdateUserRequest DTO — prevent role escalation | Task 4, 9, 10 |
| File type + size validation on image upload | Task 10 |
| frontend constant.js env variable | Task 12 |
| frontend .env + .env.example | Task 14 |
| CourseController ApiResponse<T> + constructor injection + @Valid | Task 7, 8 |
| CourseService throw 404 | Task 6 |
| Course entity @NotBlank @Min | Task 7 |
| UserController ApiResponse<T> + UserSummaryDTO + UpdateUserRequest | Task 5, 10 |
| UserService throw 404 + UpdateUserRequest | Task 9 |
| GlobalExceptionHandler 4 new handlers | Task 11 |
| spring-boot-starter-validation dependency | Task 1 |
| course.service.js unwrap .data.data | Task 13 |
