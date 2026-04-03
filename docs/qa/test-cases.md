# LMS Test Cases

**Project:** ELearning Management System  
**Tech Stack:** React + Spring Boot + MySQL  
**Date:** 2026-04-03  
**Total Cases:** 60

---

## Module 1: Authentication

| TC ID | Title | Precondition | Steps | Expected Result | Priority | Type |
|-------|-------|-------------|-------|----------------|----------|------|
| TC-A01 | Login with valid credentials | User registered | 1. Go to /login 2. Enter valid email + password 3. Click Login | Redirect to dashboard; JWT stored in localStorage | P1 | Functional |
| TC-A02 | Login with invalid email format | — | 1. Enter `notanemail` 2. Click Login | Validation error: "Invalid email format" | P2 | Validation |
| TC-A03 | Login with wrong password | User registered | 1. Enter correct email + wrong password 2. Click Login | Error: "Invalid credentials" (401) | P1 | Functional |
| TC-A04 | Login with empty fields | — | 1. Click Login without input | Both fields show required error | P1 | Validation |
| TC-A05 | Login with SQL injection | — | 1. Enter `' OR 1=1 --` in email field | Request rejected; no SQL error exposed | P1 | Security |
| TC-A06 | Login with XSS payload | — | 1. Enter `<script>alert(1)</script>` in email | Input sanitized; no alert fires | P1 | Security |
| TC-A07 | Register with valid new user | OTP email available | 1. Fill all fields 2. Click Send OTP 3. Enter OTP 4. Submit | Account created; redirect to login | P1 | Functional |
| TC-A08 | Register with existing email | User already exists | 1. Register with duplicate email | Error: "Email already registered" (409) | P1 | Functional |
| TC-A09 | Register with mismatched passwords | — | 1. Enter different confirm password | Error: "Passwords do not match" | P1 | Validation |
| TC-A10 | OTP send to non-existent email (reset) | — | 1. POST /api/auth/send-otp with unknown email | Error: "User not found" (404) | P2 | Error Handling |
| TC-A11 | Password reset with valid OTP | OTP sent | 1. Enter email + correct OTP + new password | Password updated; success message | P1 | Functional |
| TC-A12 | Password reset with expired/invalid OTP | OTP sent | 1. Enter wrong OTP | Error: "Invalid or expired OTP" (400) | P1 | Error Handling |
| TC-A13 | Logout clears session | Logged in | 1. Click Logout | localStorage cleared; redirect to /login | P1 | Functional |
| TC-A14 | Access protected route without JWT | Not logged in | 1. Navigate to /dashboard | Redirect to /login | P1 | Security |
| TC-A15 | Expired JWT handling | JWT expired | 1. Wait for token expiry 2. Make API call | 401 received; auto-redirect to login | P1 | Security |

---

## Module 2: Course Management

| TC ID | Title | Precondition | Steps | Expected Result | Priority | Type |
|-------|-------|-------------|-------|----------------|----------|------|
| TC-C01 | View published courses (user) | Courses exist | 1. Login as user 2. Navigate to /courses | All published courses displayed | P1 | Functional |
| TC-C02 | View course details | Course exists | 1. Click on a course card | Course name, description, instructor shown | P1 | Functional |
| TC-C03 | Enroll in a course | Logged in | 1. Open course 2. Click Enroll | Enrollment saved; course in My Learnings | P1 | Functional |
| TC-C04 | Enroll in already-enrolled course | Already enrolled | 1. Re-enroll same course | Error or no-op; single enrollment only | P2 | Edge Case |
| TC-C05 | Admin creates course | Admin logged in | 1. Go to Admin > Courses 2. Click Add 3. Fill form 4. Save | Course created; visible in listing | P1 | Functional |
| TC-C06 | Admin updates course | Course exists | 1. Edit course fields 2. Save | Changes reflected immediately | P1 | Functional |
| TC-C07 | Admin deletes course | Course exists | 1. Click delete on course 2. Confirm | Course removed from listing | P1 | Functional |
| TC-C08 | Admin toggles course publish | Course exists | 1. Toggle publish status | Course visibility changes for users | P1 | Functional |
| TC-C09 | Unpublished course not visible to user | Course unpublished | 1. Login as user 2. Browse courses | Unpublished course not shown | P1 | Security |
| TC-C10 | User cannot create course | Logged in as user | 1. POST /api/courses with user JWT | 403 Forbidden response | P1 | Role-Based |
| TC-C11 | Course with empty name rejected | Admin | 1. Submit course form with blank name | Validation error | P2 | Validation |
| TC-C12 | Course listing loads correctly | Multiple courses | 1. Open courses page | All course cards render with thumbnails | P1 | UI |

---

## Module 3: Video Playback

| TC ID | Title | Precondition | Steps | Expected Result | Priority | Type |
|-------|-------|-------------|-------|----------------|----------|------|
| TC-V01 | Video player renders in learning page | Enrolled, course has video | 1. Open course learning page | Video player visible; no broken player | P1 | UI |
| TC-V02 | Video plays from YouTube link | Course has y_link | 1. Click play | Video streams from YouTube | P1 | Functional |
| TC-V03 | Video plays from direct link | Course has p_link | 1. Click play | Video streams from p_link URL | P1 | Functional |
| TC-V04 | Video progress is tracked | Enrolled | 1. Watch 50% of video 2. Call GET /api/progress/{userId}/{courseId} | Progress ≈ 50% stored | P1 | Functional |
| TC-V05 | Video progress saved on pause/seek | Enrolled | 1. Pause at 30s 2. Reload page | Progress resumes near 30s position | P2 | Functional |
| TC-V06 | Unenrolled user cannot watch video | Not enrolled | 1. Access /learning/{courseId} directly | Redirect or blocked; no video access | P1 | Security |
| TC-V07 | Thumbnail renders on course card | Course has thumbnail | 1. View courses list | Thumbnail image visible and not broken | P1 | UI |
| TC-V08 | Course with no video link handled | Course missing video | 1. Open learning page | Graceful message; no JS error in console | P2 | Error Handling |
| TC-V09 | Video duration is stored | Enrolled | 1. Let video run past 10s 2. PUT /api/progress/update-duration | Duration updated in DB | P2 | Functional |

---

## Module 4: Search Functionality

| TC ID | Title | Precondition | Steps | Expected Result | Priority | Type |
|-------|-------|-------------|-------|----------------|----------|------|
| TC-S01 | Search with matching keyword | Courses exist | 1. Type course name in search 2. Submit | Matching courses displayed | P1 | Functional |
| TC-S02 | Search case-insensitive | Courses exist | 1. Search "python" vs "Python" | Same results returned | P2 | Functional |
| TC-S03 | Search with no results | — | 1. Search "xyznonexistent" | "No results found" message displayed | P1 | Functional |
| TC-S04 | Search with empty input | — | 1. Submit empty search | All courses shown OR validation message | P2 | Edge Case |
| TC-S05 | Search with special characters | — | 1. Search `<script>alert(1)</script>` | Input sanitized; no XSS | P1 | Security |
| TC-S06 | Search with very long string | — | 1. Paste 500-char string in search | No crash; truncation or error message | P2 | Edge Case |
| TC-S07 | Search bar visible on course page | — | 1. Navigate to /courses | Search bar rendered in correct position | P2 | UI |

---

## Module 5: Admin Features

| TC ID | Title | Precondition | Steps | Expected Result | Priority | Type |
|-------|-------|-------------|-------|----------------|----------|------|
| TC-ADM01 | Admin dashboard accessible by admin | Admin JWT | 1. Login as admin 2. Go to /admin | Dashboard loads with stats | P1 | Role-Based |
| TC-ADM02 | Admin dashboard blocked for user | User JWT | 1. Login as user 2. Navigate to /admin | 403 or redirect to user dashboard | P1 | Security |
| TC-ADM03 | Admin views all users | Admin JWT | 1. GET /api/users | List of all users returned | P1 | Functional |
| TC-ADM04 | Admin deletes user | Admin JWT, user exists | 1. DELETE /api/users/{id} | User removed from DB | P1 | Functional |
| TC-ADM05 | Admin broadcasts message | Admin JWT | 1. POST /api/messages/broadcast with content | All users receive message | P1 | Functional |
| TC-ADM06 | Admin creates announcement | Admin JWT | 1. POST /api/announcements | Announcement saved | P1 | Functional |
| TC-ADM07 | Admin publishes announcement | Admin JWT | 1. PUT /api/announcements/{id}/toggle-publish | Announcement visible to users | P1 | Functional |
| TC-ADM08 | Admin adds quiz question | Admin JWT | 1. POST /api/questions with course ID | Question created and linked | P1 | Functional |
| TC-ADM09 | User cannot delete other user | User JWT | 1. DELETE /api/users/{otherId} | 403 Forbidden | P1 | Security |
| TC-ADM10 | Admin analytics page loads | Admin JWT | 1. Navigate to Analytics | Charts render without error | P2 | UI |

---

## Module 6: Assessment

| TC ID | Title | Precondition | Steps | Expected Result | Priority | Type |
|-------|-------|-------------|-------|----------------|----------|------|
| TC-AS01 | User takes assessment | Enrolled, questions exist | 1. Open Assessment page 2. Answer all 3. Submit | Score calculated; result saved | P1 | Functional |
| TC-AS02 | Submit incomplete assessment | — | 1. Skip some answers 2. Submit | Warning or auto-score with 0 for blanks | P2 | Edge Case |
| TC-AS03 | View assessment history | Assessments taken | 1. GET /api/assessments/user/{id}/course/{cid} | Previous scores displayed | P1 | Functional |
| TC-AS04 | Certificate generated on completion | 100% progress + assessment passed | 1. Navigate to certificate page | Certificate renders with user name | P2 | Functional |

---

## Module 7: User Profile

| TC ID | Title | Precondition | Steps | Expected Result | Priority | Type |
|-------|-------|-------------|-------|----------------|----------|------|
| TC-P01 | View own profile | Logged in | 1. Go to /profile | Profile data shown correctly | P1 | Functional |
| TC-P02 | Edit profile fields | Logged in | 1. Open edit modal 2. Change name 3. Save | Updated data reflected | P1 | Functional |
| TC-P03 | Upload profile image | Logged in | 1. Upload valid JPG/PNG | Image saved; displayed in nav | P1 | Functional |
| TC-P04 | Upload oversized image | Logged in | 1. Upload 10MB image | Error: file too large | P2 | Edge Case |
| TC-P05 | User cannot edit another user's profile | User JWT | 1. PUT /api/users/{otherId} | 403 Forbidden | P1 | Security |

---

## Module 8: Real User Journey (E2E)

| TC ID | Title | Steps | Expected Result | Priority |
|-------|-------|-------|----------------|----------|
| TC-E2E01 | Full user journey: Register → Enroll → Watch | Register → Verify OTP → Login → Browse → Enroll → Watch video → Check progress | Progress tracked; all steps complete | P1 |
| TC-E2E02 | Full admin journey: Login → Create Course → Publish | Admin login → Create course with video link → Publish → Verify visible to users | Course visible after publish | P1 |
| TC-E2E03 | Password reset flow | Request OTP → Enter OTP → Set new password → Login with new password | Login succeeds with new password | P1 |
| TC-E2E04 | Assessment completion journey | Enroll → Watch → Take assessment → View score | Score saved; certificate option available | P2 |

---

## Summary

| Module | Total | P1 | P2 | Functional | Security | Edge Case | UI |
|--------|-------|----|----|-----------|----------|-----------|-----|
| Auth | 15 | 11 | 4 | 8 | 4 | 1 | 2 |
| Courses | 12 | 9 | 3 | 8 | 2 | 1 | 1 |
| Video | 9 | 6 | 3 | 7 | 1 | 0 | 1 |
| Search | 7 | 3 | 4 | 4 | 1 | 2 | 0 |
| Admin | 10 | 8 | 2 | 7 | 2 | 0 | 1 |
| Assessment | 4 | 2 | 2 | 3 | 0 | 1 | 0 |
| Profile | 5 | 3 | 2 | 3 | 1 | 1 | 0 |
| E2E | 4 | 3 | 1 | 4 | 0 | 0 | 0 |
| **Total** | **66** | **45** | **21** | **44** | **11** | **6** | **5** |
