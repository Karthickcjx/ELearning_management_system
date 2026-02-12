# Learning Management System

## Overview

This project is a Learning Management System (LMS) built with React.js for the frontend, Spring Boot for the backend, and MySQL as the database. It provides a comprehensive platform for managing online courses, user profiles, assessments, progress tracking, and more.

---

## Features

### User Management
- User registration and login functionality.
- User profiles with the ability to update information.

### Course Management
- Admin can add, edit, and manage courses.
- Course details include name, instructor, description, and more.

### Assessment
- Users can take assessments related to courses.
- Admin can create and manage assessment questions.

### Progress Tracking
- Monitor user progress and completion status.
- Visual representation of user progress.

### Certificate Generation
- Automatic certificate generation upon course completion.
- Personalized certificates with user details.

### Discussion Forum
- Course-specific discussion forums for users.
- Interaction between users and instructors.

### Authentication & Security
- JWT token-based authentication.
- Role-based access control (**ADMIN**, **USER**).
- Secure password encryption.
- Default admin account for initial setup.
- *Note: INSTRUCTOR role will be implemented soon.*

### Admin Dashboard
- Manage courses and assessment questions.
- Track students, courses, and enrollments.

--- 

## Technologies Used

### Frontend
- **Core Framework:** React, React DOM, React Router  
- **UI Components:** Ant Design, Lucide Icons, FontAwesome
- **Styling:** Tailwind CSS  
- **API Communication:** Axios
- **Additional Libraries:** React Player, jsPDF, html2canvas, Moment.js, React DOM Confetti

### Backend
- **Framework:** Spring Boot  
- **Language:** Java  
- **Security:** Spring Security with JWT
- **Authentication:** Role-Based Access Control
- **Database Integration:** Spring Data JPA
- **Architecture:** RESTful API
- **Build Tool:** Maven

### Database
- **MySQL**
- **Tables:** course, learning, progress, discussion, feedback, question, user, assessment

---

## Setup


### Prerequisites
- Java 17 or higher  
- Maven 3.6+  
- MySQL 8.0+  
- Node.js and npm


1. Clone the repository:

    ```bash
    git clone https://github.com/Karthickcjx/ELearning_management_system.git
    ```

2. Navigate to the frontend and backend folders and follow their respective setup instructions.

## Backend

- Open the backend folder in IntelliJ IDEA or Spring Tool Suite (STS).
- Update the database credentials in backend/application.properties.
- Build and run the project from the IDE.

## Frontend

- Open the frontend folder in Visual Studio Code (VS Code).
- Then the terminal, run:

```bash
    npm install
    npm start
```  

## Usage

- Visit the application on http://localhost:3000.

- As an admin, you can manage courses, create assessments, and monitor user progress. To access the admin dashboard, if your application is running locally, you can navigate to http://localhost:3000/admin.

## Default Admin Credentials
- Email: admin@gmail.com
- Password: admin123

- Users can register, log in, view courses, take assessments, and receive certificates.

## API Documentation

- Access interactive API docs at:
  http://localhost:8080/swagger-ui/index.html

## Contributing

- Open issues to report bugs or suggest features
- Submit pull requests to improve the project
- Feedback and contributions are highly appreciated