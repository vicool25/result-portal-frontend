import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

function GradeBadge({ grade }) {
  const colors = { A: 'grade-a', B: 'grade-b', C: 'grade-c', D: 'grade-d', F: 'grade-f' };
  return <span className={`grade-badge ${colors[grade] || ''}`}>{grade}</span>;
}

export default function Portal() {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [student, setStudent] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!studentId.trim()) {
      setError('Please enter your Student ID.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await api.portalLookupStudent(studentId.trim());
      setStudent(data);
    } catch (err) {
      setError(err.message);
      setStudent(null);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setStudent(null);
    setStudentId('');
    setError('');
  }

  function handlePrint() {
    window.print();
  }

  if (student) {
    const groupedResults = {};
    (student.results || []).forEach((r) => {
      const key = `${r.academic_year} - ${r.semester}`;
      if (!groupedResults[key]) groupedResults[key] = [];
      groupedResults[key].push(r);
    });

    return (
      <div className="portal-result-page">
        <div className="portal-result-actions print-hide">
          <Link to="/login" className="btn btn-outline btn-sm">← Admin Login</Link>
          <div className="portal-result-actions-right">
            <button className="btn btn-outline btn-sm" onClick={handleReset}>← Check Another ID</button>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>🖨 Print Result</button>
          </div>
        </div>

        <div className="portal-result-card">
          <div className="portal-result-header">
            <div className="portal-school-info">
              <div className="portal-school-logo">🎓</div>
              <div>
                <h1>STUDENT RESULT PORTAL</h1>
                <p className="portal-school-sub">Official Academic Transcript</p>
              </div>
            </div>
            <div className="portal-issue-date">
              <span className="portal-issue-label">Issued</span>
              <span className="portal-issue-value">{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          <div className="portal-student-profile">
            <div className="portal-avatar">
              {student.first_name.charAt(0)}{student.last_name.charAt(0)}
            </div>
            <div className="portal-student-info">
              <h2>{student.first_name} {student.last_name}</h2>
              <p className="portal-student-id">Student ID: <span className="mono">{student.student_id}</span></p>
              <div className="portal-student-meta">
                {student.department && <span className="tag">{student.department}</span>}
                {student.level && <span className="tag tag-light">{student.level}</span>}
              </div>
            </div>
            <div className="portal-gpa-box">
              <span className="portal-gpa-label">CGPA</span>
              <span className="portal-gpa-value">{student.gpa}</span>
              <span className="portal-gpa-sub">{student.totalCredits} credits</span>
            </div>
          </div>

          <div className="portal-contact-grid">
            {student.email && (
              <div className="portal-contact-item">
                <span className="portal-contact-label">Email</span>
                <span>{student.email}</span>
              </div>
            )}
            {student.phone && (
              <div className="portal-contact-item">
                <span className="portal-contact-label">Phone</span>
                <span>{student.phone}</span>
              </div>
            )}
            <div className="portal-contact-item">
              <span className="portal-contact-label">Courses Taken</span>
              <span>{student.results?.length || 0}</span>
            </div>
            <div className="portal-contact-item">
              <span className="portal-contact-label">Registered</span>
              <span>{new Date(student.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {(!student.results || student.results.length === 0) ? (
            <div className="portal-empty">
              <div className="portal-empty-icon">📝</div>
              <p>No academic results have been recorded for this student yet.</p>
            </div>
          ) : (
            Object.entries(groupedResults).map(([period, results]) => {
              const periodCredits = results.reduce((s, r) => s + r.credit_hours, 0);
              const gradePoints = { A: 4.0, B: 3.0, C: 2.0, D: 1.0, F: 0.0 };
              const periodQP = results.reduce((s, r) => s + (gradePoints[r.grade] || 0) * r.credit_hours, 0);
              const periodGPA = periodCredits > 0 ? (periodQP / periodCredits).toFixed(2) : '0.00';

              return (
                <div key={period} className="portal-semester-section">
                  <div className="portal-semester-header">
                    <h3>{period}</h3>
                    <div className="portal-semester-gpa">
                      <span>Semester GPA:</span>
                      <strong>{periodGPA}</strong>
                      <span className="portal-semester-credits">({periodCredits} cr)</span>
                    </div>
                  </div>
                  <div className="table-wrapper">
                    <table className="data-table portal-table">
                      <thead>
                        <tr>
                          <th>Course Code</th>
                          <th>Course Name</th>
                          <th className="num-col">Credit</th>
                          <th className="num-col">Score</th>
                          <th>Grade</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r) => (
                          <tr key={r.id}>
                            <td className="mono">{r.course_code}</td>
                            <td>{r.course_name}</td>
                            <td className="num-col">{r.credit_hours}</td>
                            <td className="num-col score-cell">{r.score}</td>
                            <td><GradeBadge grade={r.grade} /></td>
                            <td className="small-text">{r.remarks || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}

          <div className="portal-result-footer">
            <p>This is a system-generated document. Official records are maintained by the Registrar's Office.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page portal-page">
      <div className="portal-top-link print-hide">
        <Link to="/login" className="btn btn-outline btn-sm">← Admin Login</Link>
      </div>

      <div className="auth-card portal-card">
        <div className="auth-header">
          <div className="auth-logo">🎓</div>
          <h1>Student Result Portal</h1>
          <p>Enter your Student ID to view your results</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="studentId">Student ID</label>
            <input
              id="studentId"
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g. STU001"
              required
              autoComplete="off"
              autoFocus
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner spinner-sm" />
                Looking up...
              </>
            ) : (
              'View My Results'
            )}
          </button>
        </form>

        <div className="portal-tips">
          <p>💡 Tips:</p>
          <ul>
            <li>Enter your Student ID exactly as provided by the school</li>
            <li>Make sure there are no extra spaces before or after the ID</li>
            <li>Contact the administration if you encounter any issues</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
