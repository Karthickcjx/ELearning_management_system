# LMS Bug Report & Fix Suggestions

**Project:** ELearning Management System  
**Date:** 2026-04-03  
**Reviewed by:** QA Automation (Static Analysis + Code Review)  
**Severity Levels:** P0 = Critical | P1 = High | P2 = Medium | P3 = Low

---

## Bug Summary

| BUG ID | Module | Title | Severity | Type |
|--------|--------|-------|----------|------|
| BUG-001 | Security | Hardcoded secrets in application.yml | P0 | Security |
| BUG-002 | Security | JWT stored in localStorage (XSS risk) | P1 | Security |
| BUG-003 | Security | No CSRF protection comment is misleading | P2 | Security |
| BUG-004 | Auth | No brute-force protection on /api/auth/login | P1 | Security |
| BUG-005 | Auth | OTP not rate-limited (email bombing) | P1 | Security |
| BUG-006 | Courses | No input sanitization on course description (stored XSS) | P1 | Security |
| BUG-007 | Config | CORS allows localhost origins without env override | P2 | Configuration |
| BUG-008 | Video | Missing null-check for video link causes potential crash | P2 | Bug |
| BUG-009 | Profile | No file size/type validation on image upload | P2 | Bug |
| BUG-010 | Database | Profile images stored as BLOB (performance) | P2 | Performance |
| BUG-011 | Testing | Nearly zero test coverage (1 placeholder test) | P1 | Testing |
| BUG-012 | Auth | Admin credentials exposed in application.yml | P0 | Security |
| BUG-013 | API | No pagination on /api/users and /api/courses | P2 | Performance |
| BUG-014 | Email | Gmail app password hardcoded in config | P0 | Security |
| BUG-015 | AI | Cohere API key hardcoded in application.yml | P0 | Security |

---

## Detailed Bug Descriptions

---

### BUG-001 — Hardcoded Database Password in Config

**Severity:** P0 — Critical  
**Module:** Configuration  
**File:** `backend/src/main/resources/application.yml`

**Description:**  
The MySQL password was hardcoded directly in the application config file. If this file is committed to a public repository, credentials are immediately exposed.

```yaml
# CURRENT (insecure)
spring.datasource.password: <redacted>
```

**Fix:**
```yaml
# CORRECT
spring:
  datasource:
    password: ${DB_PASSWORD}
```
Set `DB_PASSWORD` in a `.env` file that is listed in `.gitignore`. Never commit real credentials to version control.

---

### BUG-002 — JWT Token Stored in localStorage (XSS Attack Vector)

**Severity:** P1 — High  
**Module:** Frontend Authentication  
**File:** `frontend/src/api/api.js`, `frontend/src/api/auth.service.js`

**Description:**  
The JWT is stored in `localStorage.token`. Any JavaScript on the page (including from XSS) can read it. A single XSS vulnerability anywhere on the site allows a full account takeover.

**Fix:**  
Store the JWT in an `HttpOnly` cookie instead. The browser prevents JavaScript from accessing `HttpOnly` cookies, neutralizing XSS-based token theft.

```javascript
// Backend: set-cookie on login response
response.addCookie(new Cookie("token", jwt) {{ setHttpOnly(true); setSecure(true); setPath("/"); }});

// Frontend: remove localStorage.setItem('token') — send credentials: 'include' with axios
axios.defaults.withCredentials = true;
```

**Workaround (if HttpOnly cookies not immediately feasible):**  
Use `sessionStorage` instead of `localStorage` — token is cleared when the tab is closed, reducing the attack window.

---

### BUG-003 — No Brute-Force Protection on Login Endpoint

**Severity:** P1 — High  
**Module:** Authentication  
**File:** `backend/src/main/java/com/lms/dev/controller/AuthController.java`

**Description:**  
There is no rate limiting, account lockout, or CAPTCHA on `POST /api/auth/login`. An attacker can make unlimited login attempts to brute-force passwords.

**Fix:**  
Add rate limiting using a library like Bucket4j or Spring Boot's Resilience4j:
```java
@RateLimiter(name = "loginRateLimiter")
@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody LoginRequestDTO loginRequest) { ... }
```
Or use a configurable attempt counter in Redis/database:
- Lock account for 15 minutes after 5 failed attempts
- Require CAPTCHA after 3 failures

---

### BUG-004 — OTP Endpoint Not Rate-Limited (Email Bombing)

**Severity:** P1 — High  
**Module:** Authentication  
**File:** `backend/src/main/java/com/lms/dev/controller/AuthController.java`

**Description:**  
`POST /api/auth/send-otp` accepts unlimited requests without rate limiting. An attacker can spam any email address with OTP emails (email bombing / resource exhaustion attack).

**Fix:**  
- Limit to 3 OTP requests per email per 10-minute window
- Implement per-IP rate limiting using Bucket4j or a filter
- Return `429 Too Many Requests` when limit is exceeded

---

### BUG-005 — No Input Sanitization on Course/Discussion Fields (Stored XSS)

**Severity:** P1 — High  
**Module:** Courses, Discussions  
**File:** Backend controllers, Frontend rendering

**Description:**  
Course descriptions and forum discussion content are stored and rendered without HTML sanitization. An admin or user who can submit content could inject `<script>` tags that execute in other users' browsers.

**Steps to Reproduce:**
1. Admin creates a course with description: `<img src=x onerror=alert('XSS')>`
2. Any user who views the course listing sees the alert

**Fix:**  
Backend — sanitize HTML before persisting:
```java
// Use OWASP Java HTML Sanitizer
import org.owasp.html.PolicyFactory;
import org.owasp.html.Sanitizers;

PolicyFactory policy = Sanitizers.FORMATTING.and(Sanitizers.LINKS);
String safeHtml = policy.sanitize(userInput);
```
Frontend — use `textContent` instead of `dangerouslySetInnerHTML`, or sanitize with DOMPurify:
```javascript
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(course.description) }} />
```

---

### BUG-006 — Admin Credentials Exposed in application.yml

**Severity:** P0 — Critical  
**Module:** Configuration  
**File:** `backend/src/main/resources/application.yml`

**Description:**  
Default admin credentials (`admin@gmail.com` / `admin123`) are plaintext in the config file with the key `ADMIN_BOOTSTRAP_ENABLED=false`. The password is trivially guessable regardless.

**Fix:**
1. Remove default credentials from config entirely
2. Require the admin account to be created manually on first deploy via a secure bootstrap script
3. Enforce strong password policy in `AdminInitializer.java`
4. Enable `ADMIN_BOOTSTRAP_ENABLED` only in staging/dev environments

---

### BUG-007 — Gmail App Password and Cohere API Key in Config

**Severity:** P0 — Critical  
**Module:** Configuration  
**File:** `backend/src/main/resources/application.yml`

**Description:**  
Two secret credentials are hardcoded:
- Gmail app password: `[redacted]`
- Cohere API key: `[redacted]`

If this repo is public or the config is leaked, these secrets are compromised immediately. The Cohere API key allows anyone to consume the account's quota.

**Fix:**
```yaml
# Move ALL secrets to environment variables
cohere:
  api-key: ${COHERE_API_KEY}
spring:
  mail:
    password: ${MAIL_PASSWORD}
```
Add `application.yml` to `.gitignore` and use `application.yml.example` with placeholder values as a template.

---

### BUG-008 — No File Validation on Profile Image Upload

**Severity:** P2 — Medium  
**Module:** User Profile  
**File:** `backend/src/main/java/com/lms/dev/controller/UserController.java`

**Description:**  
The `/api/users/{id}/upload-image` endpoint accepts any `MultipartFile`. There is no validation for:
- File size (user can upload 100MB files)
- File type (user can upload `.exe` or `.html` files as "images")
- MIME type spoofing

**Fix:**
```java
@PostMapping("/{id}/upload-image")
public ResponseEntity<?> uploadImage(@PathVariable UUID id,
                                      @RequestParam("file") MultipartFile file) {
    // Validate file type
    String contentType = file.getContentType();
    if (!List.of("image/jpeg", "image/png", "image/gif", "image/webp").contains(contentType)) {
        throw new BadRequestException("Only image files are allowed");
    }
    // Validate file size (max 2MB)
    if (file.getSize() > 2 * 1024 * 1024) {
        throw new BadRequestException("File size must not exceed 2MB");
    }
    // ... rest of upload logic
}
```

---

### BUG-009 — Profile Images Stored as BLOB in Database

**Severity:** P2 — Medium  
**Module:** User Profile  
**File:** `backend/src/main/java/com/lms/dev/entity/User.java`

**Description:**  
Profile images are stored as `byte[]` (BLOB) directly in the MySQL database. This causes:
- Extremely slow queries when fetching user lists (loading MB of image data)
- Database bloat
- No CDN caching possible
- Memory pressure on the application server

**Fix:**  
Store images in an object store (AWS S3, Cloudflare R2, or local filesystem) and store only the URL/path in the database:
```java
// User entity
private String profileImageUrl; // Store URL, not bytes
```
This aligns with the project description which mentions AWS S3.

---

### BUG-010 — No Pagination on User/Course List Endpoints

**Severity:** P2 — Medium  
**Module:** API  
**Files:** `UserController.java`, `CourseController.java`

**Description:**  
`GET /api/users` and `GET /api/courses` return the entire table without pagination. As the platform grows, these endpoints will cause:
- Out-of-memory errors
- Timeouts
- Slow UI rendering

**Fix:**
```java
@GetMapping
public ResponseEntity<?> getAllCourses(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
    Page<Course> courses = courseRepository.findAll(pageable);
    return ResponseEntity.ok(new ApiResponse<>("Success", courses, LocalDateTime.now()));
}
```

---

### BUG-011 — CORS Allows Only Hardcoded localhost Origins

**Severity:** P2 — Medium  
**Module:** Configuration  
**File:** `backend/src/main/java/com/lms/dev/config/WebSecurityConfig.java`

**Description:**  
CORS is configured to only allow `http://localhost:3000`, `http://127.0.0.1:3000`, and `http://localhost:3001`. When deployed to a real domain, all frontend requests will be blocked by CORS.

**Fix:**
```java
// Read allowed origins from environment variable
@Value("${app.cors.allowedOrigins:http://localhost:3000}")
private String[] allowedOrigins;

configuration.setAllowedOrigins(Arrays.asList(allowedOrigins));
```

---

### BUG-012 — Nearly Zero Automated Test Coverage

**Severity:** P1 — High  
**Module:** Testing  
**File:** `backend/src/test/java/com/lms/dev/LearningManagementSystemApplicationTests.java`

**Description:**  
The entire codebase has exactly 1 test: a Spring Boot context load test with no assertions. There are no unit tests, integration tests, or service-layer tests. This means:
- Regressions go undetected
- No confidence when deploying changes
- No validation that business logic is correct

**Fix:**  
The REST Assured tests in `backend/src/test/java/com/lms/dev/api/` (created as part of this QA engagement) cover the core API paths. Additionally, add unit tests for:
- `JwtUtils.java` — token generation/validation
- `OtpService.java` — OTP expiry and validation logic
- `ProgressService.java` — percentage calculation
- `AssessmentService.java` — score calculation

---

## Severity Summary

| Severity | Count | Issues |
|----------|-------|--------|
| P0 Critical | 3 | BUG-001, BUG-006, BUG-007 |
| P1 High | 5 | BUG-002, BUG-003, BUG-004, BUG-005, BUG-012 |
| P2 Medium | 5 | BUG-008, BUG-009, BUG-010, BUG-011 |
| P3 Low | 0 | — |

---

## Priority Fix Order

1. **Immediately** — Move all secrets to env variables (BUG-001, BUG-006, BUG-007). These are P0 and could result in account compromises if the repo is public.
2. **Before next release** — Add rate limiting to login and OTP endpoints (BUG-003, BUG-004). Validate file uploads (BUG-008).
3. **Short term** — Switch JWT storage to HttpOnly cookies (BUG-002). Add HTML sanitization (BUG-005). Fix CORS for production (BUG-011).
4. **Medium term** — Add pagination (BUG-010). Migrate images to S3 (BUG-009). Expand test coverage (BUG-012).
