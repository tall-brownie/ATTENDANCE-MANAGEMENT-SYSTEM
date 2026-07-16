        method: "POST",
        body: JSON.stringify({
          courseId: Number(courseId),
          date,
          records
        })
      });
      setMessage("Attendance saved.");
      await loadAttendance();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function addStudent(event) {
    event.preventDefault();
    try {
      const created = await api("/api/students", {
        method: "POST",
        body: JSON.stringify(studentForm)
      });
      setStudents((current) => [...current, created]);
      setStudentForm({ rollNumber: "", name: "", email: "", phone: "" });
      setMessage("Student added and enrolled in all courses.");
      await loadAttendance();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand-mark">
            <CalendarCheck size={24} />
          </div>
          <h1>Attendance Manager</h1>
          <p>Track daily classroom attendance with a SQL-backed record system.</p>
        </div>

        <div className="stats-grid">
          <Metric label="Students" value={students.length} />
          <Metric label="Courses" value={courses.length} />
        </div>

        <form className="student-form" onSubmit={addStudent}>
          <h2>Add Student</h2>
          <input
            placeholder="Roll number"
            value={studentForm.rollNumber}
            onChange={(event) =>
              setStudentForm({ ...studentForm, rollNumber: event.target.value })
            }
            required
          />
          <input
            placeholder="Full name"
            value={studentForm.name}
            onChange={(event) =>
              setStudentForm({ ...studentForm, name: event.target.value })
            }
            required
          />
          <input
            placeholder="Email"
            type="email"
            value={studentForm.email}
            onChange={(event) =>
              setStudentForm({ ...studentForm, email: event.target.value })
            }
          />
          <input
            placeholder="Phone"
            value={studentForm.phone}
            onChange={(event) =>
              setStudentForm({ ...studentForm, phone: event.target.value })
            }
          />
          <button type="submit">
            <Plus size={18} />
            Add
          </button>
        </form>
      </aside>

      <section className="workspace">
        <header className="toolbar">
          <div>
            <span className="eyebrow">Daily Register</span>
            <h2>{selectedCourse ? selectedCourse.name : "Select a course"}</h2>
          </div>
          <div className="controls">
            <select value={courseId} onChange={(event) => setCourseId(event.target.value)}>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            <button className="icon-button" type="button" onClick={() => loadAttendance()} title="Refresh">
              <RefreshCw size={18} />
            </button>
            <button type="button" onClick={saveAttendance}>
              <Save size={18} />
              Save
            </button>
          </div>
        </header>

        {message && <div className="notice">{message}</div>}

        <section className="content-grid">
          <div className="panel attendance-panel">
            <div className="panel-heading">
              <h3>Attendance</h3>
              <span>{records.length} enrolled</span>
            </div>
            {loading ? (
              <p className="empty">Loading records...</p>
            ) : (
              <div className="record-list">
                {records.map((record) => (
                  <article className="record-row" key={record.studentId}>
                    <div className="student-cell">
                      <strong>{record.name}</strong>
                      <span>{record.rollNumber}</span>
                    </div>
                    <div className="status-options">
                      {statuses.map((status) => (
                        <label key={status} className={record.status === status ? "active" : ""}>
                          <input
                            type="radio"
                            name={`status-${record.studentId}`}
                            value={status}
                            checked={record.status === status}
                            onChange={(event) =>
                              updateRecord(record.studentId, "status", event.target.value)
                            }
                          />
                          {status}
                        </label>
                      ))}
                    </div>
                    <input
                      className="notes-input"
                      placeholder="Notes"
                      value={record.notes}
                      onChange={(event) =>
                        updateRecord(record.studentId, "notes", event.target.value)
                      }
                    />
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="panel summary-panel">
            <div className="panel-heading">
              <h3>Summary</h3>
              <Users size={18} />
            </div>
            <div className="summary-list">
              {summary.map((item) => (
                <article key={item.studentId} className="summary-row">
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.rollNumber}</span>
                  </div>
                  <div className="rate">
                    <b>{item.attendanceRate}%</b>
                    <span>{item.present + item.late}/{item.totalMarked || 0}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);