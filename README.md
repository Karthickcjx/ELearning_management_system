# EduVerse Learning Management System

EduVerse is a full-stack Learning Management System built with a React frontend, a Spring Boot backend, and MySQL. It supports course delivery, assessments, progress tracking, certificates, discussion forums, messaging, admin analytics, AI assistance, and collaborative learning rooms.

## Features

- Authentication with JWT, password hashing, role-based access, and default admin bootstrap
- User registration, login, profile management, profile images, and personalized interests
- Course catalog, course details, enrollments, learning history, and progress tracking
- Assessments, question management, performance views, and certificate generation
- Discussion forums, course feedback, ratings, and review moderation
- Admin dashboard for users, courses, analytics, announcements, messages, reviews, and settings
- AI chat, streaming AI responses, course recommendations, usage tracking, and feedback
- Career roadmap planner with domain previews and saved learner roadmaps
- Collaborative rooms with matching, chat, whiteboard, hints, voice signaling, and room history
- Notifications, assignments, student dashboard, and direct/broadcast messaging

## Tech Stack

### Frontend

- React 18, React Router, React Scripts
- Ant Design, Lucide React, FontAwesome, Recharts
- Tailwind CSS and custom CSS
- Axios for API requests
- React Player, jsPDF, html2canvas, React Markdown, Moment.js
- Playwright end-to-end test files

### Backend

- Java 17 and Spring Boot 3.2.1
- Spring Web, Spring Security, Spring Data JPA, Spring WebSocket
- JWT authentication with `jjwt`
- MySQL in development and H2 for tests
- Springdoc OpenAPI / Swagger UI
- Maven wrapper

## Project Structure

```text
.
|-- backend/                 # Spring Boot API, security, persistence, WebSocket services
|-- frontend/                # React app, routes, pages, API clients, E2E tests
|-- docs/                    # Feature notes, QA docs, presentation, implementation specs
|-- run_backend.bat          # Windows helper for starting the backend
`-- README.md
```

## Prerequisites

- Java 17 or newer
- Node.js and npm
- MySQL 8 or newer
- Git

Maven does not need to be installed globally if you use the included Maven wrapper.

## Backend Setup

1. Create a MySQL database, or let the app create one through the default JDBC URL.

2. Create `backend/.env` and add local values:

   ```properties
   DB_URL=jdbc:mysql://localhost:3306/lms_new?createDatabaseIfNotExist=true
   DB_USERNAME=root
   DB_PASSWORD=your_mysql_password

   JWT_SECRET=replace_with_a_long_secure_secret_at_least_64_characters
   JWT_EXPIRATION=86400000

   ADMIN_BOOTSTRAP_ENABLED=true
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin@123
   ADMIN_EMAIL=admin@lms.local

   APP_NAME=EduVerse
   COHERE_API_KEY=your_cohere_api_key
   COHERE_MODEL=command-r7b-12-2024

   BREVO_API_KEY=your_brevo_api_key
   BREVO_SENDER_EMAIL=your_sender_email
   BREVO_SENDER_NAME=EduVerse
   ```

   The backend imports environment values from `.env` or `backend/.env`.

3. Start the backend:

   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

   On Windows PowerShell:

   ```powershell
   cd backend
   .\mvnw.cmd spring-boot:run
   ```

The API runs on `http://localhost:8081` by default.

## Frontend Setup

1. Install dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Optional: create `frontend/.env` if the backend is not running on the default URL:

   ```properties
   REACT_APP_API_URL=http://localhost:8081
   ```

3. Start the React app:

   ```bash
   npm start
   ```

The frontend runs on `http://localhost:3000` by default.

## Default Admin

When `ADMIN_BOOTSTRAP_ENABLED=true`, the backend creates an admin user if no admin exists.

- Email: `admin@lms.local`
- Username: `admin`
- Password: `admin@123`

Change these values in `backend/.env` before sharing or deploying the app.

## Useful URLs

- Frontend: `http://localhost:3000`
- Admin dashboard: `http://localhost:3000/admin`
- Backend API: `http://localhost:8081`
- Swagger UI: `http://localhost:8081/swagger-ui/index.html`

## Testing

Run backend tests:

```bash
cd backend
./mvnw test
```

Run frontend unit tests:

```bash
cd frontend
npm test
```

Run Playwright E2E tests after starting the frontend and backend:

```bash
cd frontend
npx playwright test
```

## Documentation

Additional project docs are available in the `docs/` folder:

- `docs/features/ai-realtime-feature.md`
- `docs/features/collaborative-rooms-feature.md`
- `docs/qa/test-cases.md`
- `docs/presentation/LMS_Presentation.html`

## Notes

- Do not commit real `.env` files or production secrets.
- The backend defaults are intended for local development only.
- AI and email features require valid provider credentials.
- For production, set strong secrets, restrict allowed WebSocket origins, disable insecure defaults, and review database credentials.

## Contributing

Bug reports, feature suggestions, and pull requests are welcome. Keep changes focused, document setup-impacting updates, and add tests for behavior that can regress.
