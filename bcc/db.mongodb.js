// BCC Elite Grading Portal MongoDB Schema & Seed Data
// To run: mongosh < db.mongodb.js

use('bcc_grading_system');

// 1. Create Users (embedding student details where applicable)
db.users.drop();
db.users.insertMany([
  {
    _id: ObjectId("60d5ec49f1b2c8a3f8b00001"),
    username: "admin",
    password: "$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // 'password'
    role: "admin",
    full_name: "System Administrator",
    email: "admin@bcc.edu.ph",
    created_at: new Date()
  },
  {
    _id: ObjectId("60d5ec49f1b2c8a3f8b00002"),
    username: "faculty1",
    password: "$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
    role: "faculty",
    full_name: "Dr. Maria Clara",
    email: "m.clara@bcc.edu.ph",
    created_at: new Date()
  },
  {
    _id: ObjectId("60d5ec49f1b2c8a3f8b00003"),
    username: "student1",
    password: "$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
    role: "student",
    full_name: "Juan Dela Cruz",
    email: "j.delacruz@student.bcc.edu.ph",
    student_details: {
      student_id_number: "2023-0001",
      course: "BS in Information Technology",
      year_level: 3,
      section: "B"
    },
    created_at: new Date()
  },
  {
    _id: ObjectId("60d5ec49f1b2c8a3f8b00004"),
    username: "student2",
    password: "$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
    role: "student",
    full_name: "Eliza Pineda",
    email: "e.pineda@student.bcc.edu.ph",
    student_details: {
      student_id_number: "2023-0002",
      course: "BS in Information Technology",
      year_level: 3,
      section: "B"
    },
    created_at: new Date()
  }
]);
// Create indexes for Users
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ "student_details.student_id_number": 1 }, { unique: true, partialFilterExpression: { "student_details": { $exists: true } } });

// 2. Create Courses
db.courses.drop();
db.courses.insertMany([
  {
    _id: ObjectId("60d5ec49f1b2c8a3f8b00005"),
    course_code: "IT311",
    course_title: "Web Development 2",
    units: 3
  },
  {
    _id: ObjectId("60d5ec49f1b2c8a3f8b00006"),
    course_code: "IT312",
    course_title: "Database Management Systems 2",
    units: 3
  },
  {
    _id: ObjectId("60d5ec49f1b2c8a3f8b00007"),
    course_code: "IT313",
    course_title: "Networking 1",
    units: 3
  }
]);
db.courses.createIndex({ course_code: 1 }, { unique: true });

// 3. Create Enrollments (embedding grades)
db.enrollments.drop();
db.enrollments.insertMany([
  {
    _id: ObjectId("60d5ec49f1b2c8a3f8b00008"),
    student_id: ObjectId("60d5ec49f1b2c8a3f8b00003"), // student1
    course_id: ObjectId("60d5ec49f1b2c8a3f8b00005"), // IT311
    semester: "2nd Semester",
    academic_year: "2025-2026",
    grade: {
      midterm_grade: 1.25,
      final_grade: 1.50,
      equivalent_grade: 1.40,
      remarks: "Passed",
      instructor_id: ObjectId("60d5ec49f1b2c8a3f8b00002"), // faculty1
      date_submitted: new Date()
    }
  },
  {
    _id: ObjectId("60d5ec49f1b2c8a3f8b00009"),
    student_id: ObjectId("60d5ec49f1b2c8a3f8b00003"), // student1
    course_id: ObjectId("60d5ec49f1b2c8a3f8b00006"), // IT312
    semester: "2nd Semester",
    academic_year: "2025-2026",
    grade: {
      midterm_grade: 1.75,
      final_grade: 1.50,
      equivalent_grade: 1.63,
      remarks: "Passed",
      instructor_id: ObjectId("60d5ec49f1b2c8a3f8b00002"),
      date_submitted: new Date()
    }
  },
  {
    _id: ObjectId("60d5ec49f1b2c8a3f8b0000a"),
    student_id: ObjectId("60d5ec49f1b2c8a3f8b00004"), // student2
    course_id: ObjectId("60d5ec49f1b2c8a3f8b00005"), // IT311
    semester: "2nd Semester",
    academic_year: "2025-2026",
    grade: {
      midterm_grade: 2.25,
      final_grade: 2.00,
      equivalent_grade: 2.13,
      remarks: "Passed",
      instructor_id: ObjectId("60d5ec49f1b2c8a3f8b00002"),
      date_submitted: new Date()
    }
  }
]);

// Add index for fast querying by student and course
db.enrollments.createIndex({ student_id: 1, course_id: 1, semester: 1, academic_year: 1 }, { unique: true });

print("Database initialized successfully!");
