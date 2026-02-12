@echo off
echo Starting Backend...
cd backend
set JAVA_HOME=C:\Program Files\Java\jdk-21
echo using JAVA_HOME=%JAVA_HOME%
call mvnw spring-boot:run
pause
