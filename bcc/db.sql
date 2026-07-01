-- BCC Elite Grading Portal Database Schema

CREATE DATABASE IF NOT EXISTS bcc_grading_system;
USE bcc_grading_system;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS bcc_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'faculty', 'admin') NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students details
CREATE TABLE IF NOT EXISTS bcc_students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    student_id_number VARCHAR(20) NOT NULL UNIQUE,
    course VARCHAR(100) NOT NULL,
    year_level INT NOT NULL,
    section VARCHAR(10),
    FOREIGN KEY (user_id) REFERENCES bcc_users(id) ON DELETE CASCADE
);

-- Courses/Subjects
CREATE TABLE IF NOT EXISTS bcc_courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(15) NOT NULL UNIQUE,
    course_title VARCHAR(150) NOT NULL,
    units INT NOT NULL
);

-- Enrollments (Linking students to courses)
CREATE TABLE IF NOT EXISTS bcc_enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    semester VARCHAR(20) NOT NULL, -- e.g., '1st Semester'
    academic_year VARCHAR(20) NOT NULL, -- e.g., '2025-2026'
    FOREIGN KEY (student_id) REFERENCES bcc_students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES bcc_courses(id) ON DELETE CASCADE
);

-- Grades table
CREATE TABLE IF NOT EXISTS bcc_grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT NOT NULL,
    midterm_grade DECIMAL(3,2),
    final_grade DECIMAL(3,2),
    equivalent_grade DECIMAL(3,2),
    remarks VARCHAR(20), -- 'Passed', 'Failed', 'INC'
    instructor_id INT NOT NULL,
    date_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES bcc_enrollments(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES bcc_users(id)
);

-- Seed Data
INSERT INTO bcc_users (username, password, role, full_name, email) VALUES 
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'System Administrator', 'admin@bcc.edu.ph'),
('faculty1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'faculty', 'Dr. Maria Clara', 'm.clara@bcc.edu.ph'),
('student1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'Juan Dela Cruz', 'j.delacruz@student.bcc.edu.ph'),
('student2', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'Eliza Pineda', 'e.pineda@student.bcc.edu.ph');

-- Password for all is 'password'

INSERT INTO bcc_students (user_id, student_id_number, course, year_level, section) VALUES 
(3, '2023-0001', 'BS in Information Technology', 3, 'B'),
(4, '2023-0002', 'BS in Information Technology', 3, 'B');

INSERT INTO bcc_courses (course_code, course_title, units) VALUES 
('IT311', 'Web Development 2', 3),
('IT312', 'Database Management Systems 2', 3),
('IT313', 'Networking 1', 3);

INSERT INTO bcc_enrollments (student_id, course_id, semester, academic_year) VALUES 
(1, 1, '2nd Semester', '2025-2026'),
(1, 2, '2nd Semester', '2025-2026'),
(2, 1, '2nd Semester', '2025-2026');

INSERT INTO bcc_grades (enrollment_id, midterm_grade, final_grade, equivalent_grade, remarks, instructor_id) VALUES 
(1, 1.25, 1.50, 1.40, 'Passed', 2),
(2, 1.75, 1.50, 1.63, 'Passed', 2),
(3, 2.25, 2.00, 2.13, 'Passed', 2);
