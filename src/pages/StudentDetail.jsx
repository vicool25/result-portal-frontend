import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import Modal from '../components/Modal';

function GradeBadge({ grade }) {
  const colors = { A: 'grade-a', B: 'grade-b', C: 'grade-c', D: 'grade-d', F: 'grade-f' };
  return <span className={`grade-badge ${colors[grade] || ''}`}>{grade}</span>;
}

const gradePointMap = { A: 4.0, B: 3.0, C: 2.0, D: 1.0, F: 0 };

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [editingResult, setEditingResult] = useState(null);
  const [resultForm, setResultForm] = useState({ course_id: '', score: '', semester: 'First Semester', academic_year: '2024/2025', remarks: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteResultConfirm, setDeleteResultConfirm] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      setLoading(true);
      const [studentData, coursesData] = await Promise.all([api.getStudent(id), api.getCourses({})]);
      setStudent(studentData);
      setCourses(coursesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openAddResult() {
    setEditingResult(null);
    setResultForm({ course_id: '', score: '', semester: 'First Semester', academic_year: '2024/2025', remarks: '' });
    setFormError('');
    setResultModalOpen(true);
  }

  function openEditResult(result) {
    setEditingResult(result);
    setResultForm({
      course_id: String(result.course_id),
      score: String(result.score),
      semester: result.semester,
      academic_year: result.academic_year,
      remarks: result.remarks || ''
    });
    setFormError('');
    setResultModalOpen(true);
  }

  async function handleResultSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const payload = {
        ...resultForm,
        student_id: student.id,
        score: Number(resultForm.score)
      };
      if (editingResult) {
        await api.updateResult(editingResult.id, payload);
      } else {
        await api.createResult(payload);
      }
      setResultModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteResult(resultId) {
    try {
      await api.deleteResult(resultId);
      setDeleteResultConfirm(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className="loading-state"><div className="spinner" /></div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!student) return <div className="alert alert-error">Student not found</div>;

  const totalCredits = student.results?.reduce((sum, r) => sum + r.credit_hours, 0) || 0;
  const qualityPoints = student.results?.reduce((sum, r) => sum + (gradePointMap[r.grade] || 0) * r.credit_hours, 0) || 0;
  const gpa = totalCredits > 0 ? (qualityPoints / totalCredits).toFixed(2) : '0.00';

  const assignedCourseIds = new Set(student.results?.map(r => r.course_id) || []);
  const availableCourses = editingResult
    ? courses
    : courses.filter(c => !assignedCourseIds.has(c.id));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <button className="btn btn-outline btn-back" onClick={() => navigate('/students')}>
            ← Back
          </button>
          <h2>{student.first_name} {student.last_name}</h2>
          <p className="page-subtext">Student ID: <span className="mono">{student.student_id}</span></p>
        </div>
      </div>

      <div className="student-profile">
        <div className="card profile-card">
          <div className="card-body">
            <div className="profile-header">
              <div className="profile-avatar">
                {student.first_name.charAt(0)}{student.last_name.charAt(0)}
              </div>
              <div className="profile-info">
                <h2>{student.first_name} {student.last_name}</h2>
                <p className="mono">{student.student_id}</p>
                <div className="profile-meta">
                  <span className="tag">{student.department || 'No department'}</span>
                  <span className="tag tag-light">{student.level || 'No level'}</span>
                </div>
              </div>
              <div className="gpa-box">
                <span className="gpa-label">GPA</span>
                <span className="gpa-value">{gpa}</span>
                <span className="gpa-sub">{totalCredits} credits</span>
              </div>
            </div>
            <div className="profile-grid">
              <div className="profile-item"><span className="profile-label">Email</span><span>{student.email || '—'}</span></div>
              <div className="profile-item"><span className="profile-label">Phone</span><span>{student.phone || '—'}</span></div>
              <div className="profile-item"><span className="profile-label">Department</span><span>{student.department || '—'}</span></div>
              <div className="profile-item"><span className="profile-label">Level</span><span>{student.level || '—'}</span></div>
              <div className="profile-item"><span className="profile-label">Courses Taken</span><span>{student.results?.length || 0}</span></div>
              <div className="profile-item"><span className="profile-label">Created</span><span>{new Date(student.created_at).toLocaleDateString()}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Academic Results</h3>
          <button className="btn btn-primary btn-sm" onClick={openAddResult}>+ Add Result</button>
        </div>
        <div className="card-body card-no-padding">
          {!student.results || student.results.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <p>No results recorded for this student yet.</p>
              <button className="btn btn-primary" onClick={openAddResult}>Add First Result</button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Course Name</th>
                    <th>Credit</th>
                    <th>Score</th>
                    <th>Grade</th>
                    <th>Semester / Year</th>
                    <th>Remarks</th>
                    <th className="actions-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {student.results.map((r) => (
                    <tr key={r.id}>
                      <td className="mono">{r.course_code}</td>
                      <td>{r.course_name}</td>
                      <td>{r.credit_hours}</td>
                      <td className="score-cell">{r.score}</td>
                      <td><GradeBadge grade={r.grade} /></td>
                      <td className="small-text">{r.semester}<br />{r.academic_year}</td>
                      <td className="small-text">{r.remarks || '—'}</td>
                      <td className="actions-col">
                        <button className="btn btn-sm btn-outline" onClick={() => openEditResult(r)}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => setDeleteResultConfirm(r)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={resultModalOpen} onClose={() => setResultModalOpen(false)} title={editingResult ? 'Edit Result' : 'Add New Result'}>
        {formError && <div className="alert alert-error">{formError}</div>}
        <form onSubmit={handleResultSubmit} className="form-grid">
          <div className="form-group form-full">
            <label>Course *</label>
            <select required value={resultForm.course_id} onChange={e => setResultForm({ ...resultForm, course_id: e.target.value })} disabled={!!editingResult}>
              <option value="">Select a course...</option>
              {availableCourses.map(c => (
                <option key={c.id} value={c.id}>{c.course_code} - {c.course_name} ({c.credit_hours}cr)</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Score (0-100) *</label>
            <input type="number" min="0" max="100" step="0.01" required value={resultForm.score} onChange={e => setResultForm({ ...resultForm, score: e.target.value })} placeholder="85" />
          </div>
          <div className="form-group">
            <label>Semester *</label>
            <select required value={resultForm.semester} onChange={e => setResultForm({ ...resultForm, semester: e.target.value })}>
              <option value="First Semester">First Semester</option>
              <option value="Second Semester">Second Semester</option>
            </select>
          </div>
          <div className="form-group form-full">
            <label>Academic Year *</label>
            <input required value={resultForm.academic_year} onChange={e => setResultForm({ ...resultForm, academic_year: e.target.value })} placeholder="2024/2025" list="years" />
            <datalist id="years">
              <option value="2024/2025" />
              <option value="2023/2024" />
              <option value="2022/2023" />
            </datalist>
          </div>
          <div className="form-group form-full">
            <label>Remarks</label>
            <textarea value={resultForm.remarks} onChange={e => setResultForm({ ...resultForm, remarks: e.target.value })} rows="2" placeholder="Optional remarks..." />
          </div>
          <div className="form-actions form-full">
            <button type="button" className="btn btn-outline" onClick={() => setResultModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : (editingResult ? 'Update Result' : 'Add Result')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteResultConfirm} onClose={() => setDeleteResultConfirm(null)} title="Confirm Deletion" size="sm">
        <p>Are you sure you want to delete this result for <strong>{deleteResultConfirm?.course_code}</strong>?</p>
        <div className="form-actions">
          <button className="btn btn-outline" onClick={() => setDeleteResultConfirm(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => handleDeleteResult(deleteResultConfirm.id)}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
