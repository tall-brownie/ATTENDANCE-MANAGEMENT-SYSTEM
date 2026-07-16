import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, "..");
const dataDir = path.join(serverRoot, "data");
const dbPath = path.join(dataDir, "attendance.db");
const schemaPath = path.join(serverRoot, "schema.sql");

let db;

export async function getDb() {
  if (db) {
    return db;
  }

  await fs.mkdir(dataDir, { recursive: true });

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec("PRAGMA foreign_keys = ON;");
  const schema = await fs.readFile(schemaPath, "utf8");
  await db.exec(schema);
  await seedDatabase(db);

  return db;
}

async function seedDatabase(database) {
  const row = await database.get("SELECT COUNT(*) AS count FROM students");
  if (row.count > 0) {
    return;
  }

  const students = [
    ["STU-001", "Aarav Sharma", "aarav@example.com", "9876543210"],
    ["STU-002", "Meera Patel", "meera@example.com", "9876543211"],
    ["STU-003", "Kabir Khan", "kabir@example.com", "9876543212"],
    ["STU-004", "Ananya Rao", "ananya@example.com", "9876543213"],
    ["STU-005", "Rohan Gupta", "rohan@example.com", "9876543214"]
  ];

  const courses = [
    ["CS101", "Computer Science", "Dr. Sen"],
    ["MATH201", "Applied Mathematics", "Prof. Iyer"]
  ];

  for (const student of students) {
    await database.run(
      "INSERT INTO students (roll_number, name, email, phone) VALUES (?, ?, ?, ?)",
      student
    );
  }

  for (const course of courses) {
    await database.run(
      "INSERT INTO courses (code, name, teacher) VALUES (?, ?, ?)",
      course
    );
  }

  const allStudents = await database.all("SELECT id FROM students");
  const allCourses = await database.all("SELECT id FROM courses");

  for (const course of allCourses) {
    for (const student of allStudents) {
      await database.run(
        "INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)",
        [student.id, course.id]
      );
    }
  }
}