    const student = await db.get(
      `SELECT id, roll_number AS rollNumber, name, email, phone, created_at AS createdAt
       FROM students
       WHERE id = ?`,
      [result.lastID]
    );
    res.status(201).json(student);
  } catch (error) {
    if (error.message.includes("UNIQUE")) {
      return res.status(409).json({ message: "A student with that roll number or email already exists." });
    }
    next(error);
  }
});

app.get("/api/courses", async (_req, res, next) => {
  try {
    const db = await getDb();
    const courses = await db.all(
      `SELECT id, code, name, teacher, created_at AS createdAt
       FROM courses
       ORDER BY code`
    );
    res.json(courses);
  } catch (error) {
    next(error);
  }
});

app.get("/api/attendance", async (req, res, next) => {
  try {
    const courseId = Number(req.query.courseId);
    const date = req.query.date;

    if (!courseId || !date) {
      return res.status(400).json({ message: "courseId and date are required." });
    }

    const db = await getDb();
    const records = await db.all(
      `SELECT
         s.id AS studentId,
         s.roll_number AS rollNumber,
         s.name,
         COALESCE(a.status, 'present') AS status,
         COALESCE(a.notes, '') AS notes
       FROM enrollments e
       JOIN students s ON s.id = e.student_id
       LEFT JOIN attendance_records a
         ON a.student_id = s.id
        AND a.course_id = e.course_id
        AND a.attendance_date = ?
       WHERE e.course_id = ?
       ORDER BY s.roll_number`,
      [date, courseId]
    );

    res.json(records);
  } catch (error) {
    next(error);
  }
});

app.post("/api/attendance/mark", async (req, res, next) => {
  try {
    const { courseId, date, records } = req.body;
    if (!courseId || !date || !Array.isArray(records)) {
      return res.status(400).json({ message: "courseId, date, and records are required." });
    }

    const db = await getDb();
    await db.exec("BEGIN TRANSACTION");
    try {
      for (const record of records) {
        await db.run(
          `INSERT INTO attendance_records (student_id, course_id, attendance_date, status, notes)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(student_id, course_id, attendance_date)
           DO UPDATE SET
             status = excluded.status,
             notes = excluded.notes,
             marked_at = CURRENT_TIMESTAMP`,
          [
            record.studentId,
            courseId,
            date,
            record.status,
            record.notes?.trim() || null
          ]
        );
      }
      await db.exec("COMMIT");
    } catch (error) {
      await db.exec("ROLLBACK");
      throw error;
    }

    res.json({ message: "Attendance saved." });
  } catch (error) {
    next(error);
  }
});

app.get("/api/summary", async (req, res, next) => {
  try {
    const courseId = Number(req.query.courseId);
    if (!courseId) {
      return res.status(400).json({ message: "courseId is required." });
    }

    const db = await getDb();
    const summary = await db.all(
      `SELECT
         s.id AS studentId,
         s.roll_number AS rollNumber,
         s.name,
         COUNT(a.id) AS totalMarked,
         SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present,
         SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) AS late,
         SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent,
         SUM(CASE WHEN a.status = 'excused' THEN 1 ELSE 0 END) AS excused
       FROM enrollments e
       JOIN students s ON s.id = e.student_id
       LEFT JOIN attendance_records a
         ON a.student_id = s.id
        AND a.course_id = e.course_id
       WHERE e.course_id = ?
       GROUP BY s.id
       ORDER BY s.roll_number`,
      [courseId]
    );

    res.json(summary.map((row) => ({
      ...row,
      attendanceRate: row.totalMarked
        ? Math.round(((row.present + row.late) / row.totalMarked) * 100)
        : 0
    })));
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Something went wrong on the server." });
});

app.listen(port, () => {
  console.log(`Attendance API running on http://localhost:${port}`);
});