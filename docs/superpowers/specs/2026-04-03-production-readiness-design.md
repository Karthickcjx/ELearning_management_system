# Production Readiness — Design Spec

**Date:** 2026-04-03  
**Scope:** Security hardening + API correctness (Option B from brainstorm)  
**Deployment target:** Local/dev — no infrastructure changes  
**Approach:** One branch, all changes together (backend + frontend in sync)

---

## 1. Goals

1. Remove all hardcoded secrets from version control
2. Close the privilege-escalation attack vector in `UserController`
3. Fix cryptographically weak OTP generation
4. Add file validation on image upload
5. Make `CourseController` response format consistent with the rest of the API
6. Eliminate silent `null` returns from services (replace with proper 404s)
7. Stop `getAllUsers` from loading MB of BLOB data per request
8. Catch validation and access-denied errors in `GlobalExceptionHandler` without leaking stack traces
9. Make frontend API base URL configurable via environment variable

---

## 2. Out of Scope

- Docker / docker-compose / CI/CD infrastructure
- Pagination on list endpoints
- `isPublished` / `thumbnail` fields on `Course` entity
- AWS S3 migration for profile images
- Login rate limiting (requires Redis or Bucket4j — separate cycle)

---

## 3. Section 1 — Security Fixes

### 3.1 `application.yml` — Remove real secret defaults

**Problem:** Real credentials (DB password, Gmail app password, Cohere API key, admin credentials) are used as env var fallback values. If the env var is not set, the real secret is used silently.

**Fix:** Strip all fallback values from sensitive keys. The app will fail to start (Spring `IllegalArgumentException`) if the env var is missing, which is the correct behavior.

Affected keys:
```
spring.datasource.password        → ${DB_PASSWORD}          (no fallback)
spring.mail.password              → ${MAIL_PASSWORD}         (no fallback)
app.cohere.api-key                → ${COHERE_API_KEY}        (no fallback)
app.default-admin.password        → ${ADMIN_PASSWORD}        (no fallback)
app.default-admin.email           → ${ADMIN_EMAIL}           (no fallback)
app.jwtSecret                     → ${JWT_SECRET}            (no fallback)
```

Non-sensitive keys that are safe to keep defaults (port numbers, pool sizes, log levels) are left unchanged.

**Deliverable:** `backend/.env.example` — documents every required env var with a placeholder value and a one-line description.

### 3.2 `OtpService.java` — `SecureRandom`

**Problem:** `new Random()` is seeded from system time and is predictable. An attacker who knows the approximate time an OTP was issued can brute-force the 6-digit code in ~1000 guesses.

**Fix:** Replace `new Random()` with `new SecureRandom()`. One-line change.

### 3.3 `UserController.updateUser()` — `UpdateUserRequest` DTO

**Problem:** The endpoint accepts a raw `User` entity in the request body. A caller can include `"role":"ROLE_ADMIN"` in the JSON to escalate their own privileges.

**Fix:** Create `UpdateUserRequest` DTO with exactly these fields (10 total):

```java
String username
String dob
String mobileNumber
String gender
String location
String profession
String linkedin_url
String github_url
String occupation
String learningField
```

`role`, `email`, `password`, `isActive`, `profileImage` are absent — they cannot be updated via this endpoint.

`UserController.updateUser()` accepts `UpdateUserRequest` instead of `User`.  
`UserService.updateUser()` updated to accept `UpdateUserRequest`.

### 3.4 `UserController.uploadProfileImage()` — File validation

**Problem:** No validation on file type or size. A caller can upload executables, HTML files, or 100 MB payloads as a "profile image".

**Fix:** Before calling `userService.updateUserProfile()`, validate:
- Content-Type is one of: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- File size ≤ 2 MB (2,097,152 bytes)

Return `400 Bad Request` with a descriptive message on violation.

### 3.5 `frontend/src/api/constant.js` — Env variable

**Problem:** `http://localhost:8081` is hardcoded — cannot be changed for staging or production without editing source.

**Fix:**
```js
export const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8081";
```

`"http://localhost:8081"` is kept as a fallback so local dev works with no `.env` file.

**Deliverable:** `frontend/.env.example` documenting `REACT_APP_API_URL`.

---

## 4. Section 2 — API Correctness (Backend)

### 4.1 `CourseController.java` — `ApiResponse<T>` + constructor injection

**Problem:** All methods return raw `Course` / `List<Course>` / `void`. Every other controller returns `ApiResponse<T>`. Uses field injection (`@Autowired`).

**Fix:**
- Add `@RequiredArgsConstructor`, remove `@Autowired` field
- Return types:

| Method | Before | After |
|--------|--------|-------|
| `getAllCourses` | `List<Course>` | `ResponseEntity<ApiResponse<List<Course>>>` |
| `getCourseById` | `Course` | `ResponseEntity<ApiResponse<Course>>` |
| `createCourse` | `Course` | `ResponseEntity<ApiResponse<Course>>` (201) |
| `updateCourse` | `Course` | `ResponseEntity<ApiResponse<Course>>` |
| `deleteCourse` | `void` | `ResponseEntity<ApiResponse<Void>>` |

- Add `@Valid` to `createCourse` and `updateCourse` request bodies

### 4.2 `CourseService.java` — Throw 404 instead of null

**Problem:** `getCourseById()` and `updateCourse()` return `null` when the course is not found. The controller can't distinguish "not found" from "service returned null by mistake".

**Fix:**
```java
// getCourseById
return courseRepository.findById(id)
    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

// updateCourse  
Course existing = courseRepository.findById(id)
    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
```

### 4.3 `Course.java` entity — Validation annotations

Add to fields:
```java
@NotBlank(message = "Course name is required")
private String course_name;

@NotBlank(message = "Instructor name is required")  
private String instructor;

@Min(value = 0, message = "Price cannot be negative")
private int price;
```

### 4.4 `UserController.java` — `ApiResponse<T>` + `UserSummaryDTO` for list

**Problem:** `getAllUsers()` returns `List<User>` — each `User` object carries a `LONGBLOB` profile image and an eagerly-loaded `learningCourses` collection. On a table with 500 users this is hundreds of MB per request.

**Fix:** `getAllUsers()` returns `ResponseEntity<ApiResponse<List<UserSummaryDTO>>>`.

All other single-user endpoints return `ResponseEntity<ApiResponse<User>>` (profile image is already `@JsonProperty(access = WRITE_ONLY)` on the entity, so it is excluded from JSON output).

### 4.5 `UserSummaryDTO.java` — New DTO

```java
UUID id
String username
String email
UserRole role
Boolean isActive
LocalDateTime createdAt
```

No `profileImage`, no `learningCourses`, no `password`.

Constructed from `User` via a static factory method `UserSummaryDTO.from(User user)`.

### 4.6 `UserService.java` — Throw 404 instead of null

`getUserById()` and `updateUser()` return `null` when user not found.

**Fix:** Same pattern as `CourseService` — throw `ResponseStatusException(NOT_FOUND)`.

### 4.7 `GlobalExceptionHandler.java` — Add 4 missing handlers

| Exception | HTTP Status | Response body |
|-----------|-------------|---------------|
| `MethodArgumentNotValidException` | 400 | Map of field → first error message |
| `AccessDeniedException` | 403 | `"You do not have permission to perform this action"` |
| `ResponseStatusException` | (forwarded from exception) | exception reason |
| `Exception` (catch-all) | 500 | `"An unexpected error occurred"` — no stack trace |

The catch-all `Exception` handler logs the full stack trace server-side (`log.error`) but never exposes it in the response body.

---

## 5. Section 3 — Frontend Updates

### 5.1 `course.service.js` — Unwrap `.data.data`

Once `CourseController` returns `ApiResponse<T>`, the Axios response body shape changes from:
```json
[{ "course_id": "...", "course_name": "..." }]
```
to:
```json
{ "message": "...", "data": [...], "timestamp": "..." }
```

Every method in `course.service.js` must unwrap `response.data.data` to get the actual course(s). This is a mechanical find-and-replace across all methods in that file.

### 5.2 `.env` files

| File | Contents | Committed? |
|------|----------|-----------|
| `frontend/.env` | `REACT_APP_API_URL=http://localhost:8081` | No — in `.gitignore` |
| `frontend/.env.example` | `REACT_APP_API_URL=http://your-backend-url` | Yes |
| `backend/.env.example` | All required backend env vars with placeholders | Yes |

---

## 6. File Change Summary

| File | Type | Change |
|------|------|--------|
| `backend/src/main/resources/application.yml` | Modify | Remove real secret fallbacks |
| `backend/.env.example` | **New** | Document all required env vars |
| `backend/.../service/OtpService.java` | Modify | `SecureRandom` |
| `backend/.../dto/UpdateUserRequest.java` | **New** | Safe update DTO (9 fields) |
| `backend/.../dto/UserSummaryDTO.java` | **New** | List projection (no BLOB) |
| `backend/.../controller/UserController.java` | Modify | `ApiResponse<T>`, `UpdateUserRequest`, `UserSummaryDTO` |
| `backend/.../service/UserService.java` | Modify | Throw 404, accept `UpdateUserRequest` |
| `backend/.../controller/CourseController.java` | Modify | Constructor injection, `ApiResponse<T>`, `@Valid` |
| `backend/.../service/CourseService.java` | Modify | Throw 404 |
| `backend/.../entity/Course.java` | Modify | `@NotBlank`, `@Min` |
| `backend/.../exception/GlobalExceptionHandler.java` | Modify | 4 new handlers |
| `frontend/src/api/constant.js` | Modify | Env variable |
| `frontend/src/api/course.service.js` | Modify | Unwrap `.data.data` |
| `frontend/.env` | **New** | Local dev URL |
| `frontend/.env.example` | **New** | Documented placeholder |

---

## 7. Constraints

- One new dependency added to `pom.xml`: `spring-boot-starter-validation` — required for `@Valid` to trigger Bean Validation in Spring MVC controller methods. The `@NotBlank`/`@Min` annotations are already on the classpath via JPA/Hibernate, but the web-layer validation integration requires this starter.
- No database schema changes
- No changes to frontend components — only `course.service.js` and `constant.js`
- Existing `ApiResponse<T>` DTO is reused as-is
