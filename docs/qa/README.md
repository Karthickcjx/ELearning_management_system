# QA Automation — Quick Start

## File Structure

```
docs/qa/
  test-cases.md          — 66 test cases across 8 modules (table format)
  bug-report.md          — 12 bugs with severity + fix suggestions
  README.md              — This file

frontend/
  playwright.config.js   — Playwright config (Chrome + Firefox)
  tests/e2e/
    helpers.js           — Shared login helper, test credentials
    auth.spec.js         — TC-A01–A15 (login, register, security)
    courses.spec.js      — TC-C01–C12 (CRUD, enrollment, role-based)
    video.spec.js        — TC-V01–V09 (player, thumbnails, progress)
    search.spec.js       — TC-S01–S07 (search, XSS, edge cases)
    admin.spec.js        — TC-ADM01–ADM10 (admin features, RBAC)
    user-journey.spec.js — TC-E2E01–E2E04 (full user flows)

backend/src/test/java/com/lms/dev/api/
  BaseApiTest.java                    — Shared REST Assured base + token setup
  AuthApiTest.java                    — Auth endpoint tests
  CourseApiTest.java                  — Course CRUD tests
  UserApiTest.java                    — User profile + RBAC tests
  AssessmentAndProgressApiTest.java   — Progress + assessment tests
  AnnouncementAndMessageApiTest.java  — Announcements + messaging tests
```

---

## Prerequisites

- Backend running at `http://localhost:8081`
- Frontend running at `http://localhost:3000`
- MySQL DB with at least:
  - A regular user: `testuser_qa@example.com` / `TestPass@123`
  - An admin: `admin@gmail.com` / `admin123`

---

## Run Playwright (Frontend E2E) Tests

```bash
cd frontend

# Install Playwright (first time only)
npm install
npx playwright install

# Run all tests
npx playwright test

# Run a specific file
npx playwright test tests/e2e/auth.spec.js

# Run with UI mode (visual)
npx playwright test --ui

# View HTML report
npx playwright show-report
```

---

## Run Spring Boot (Backend API) Tests

```bash
cd backend

# Make sure the app is running first, then:
mvn test -Dtest="*ApiTest"

# Or run a specific test class:
mvn test -Dtest="AuthApiTest"
mvn test -Dtest="CourseApiTest"
```

---

## Test Credentials Setup

If the test users don't exist yet, register them via the API:

```bash
# Create test user (after starting the backend)
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser_qa@example.com","password":"TestPass@123","name":"QA Test User","username":"qa_testuser","otp":"<from_email>"}'
```

Or enable `ADMIN_BOOTSTRAP_ENABLED=true` in environment to auto-create the admin.
