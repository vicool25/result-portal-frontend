import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import Modal from '../components/Modal';

function GradeBadge({ grade }) {
  const colors = { A: 'grade-a', B: 'grade-b', C: 'grade-c', D: 'grade-d', F: 'grade-f' };
  return <span className={`grade-badge ${colors[grade] || ''}`}>{grade}</span>;
}

export default function Results() {
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ student_id: '', course_id: '', score: '', semester: 'First Semester', academic_year: '2024/2025', remarks: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      setLoading(true);
      const [r, s, c] = await Promise.all([api.getResults({}), api.getStudents({}), api.getCourses({})]);
      setResults(r);
      setStudents(s);
      setCourses(c);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = results?.filter(r => {
    if (search) {
      const q = search.toLowerCase();
      const matchName = `${r.first_name} ${r.last_name}`.toLowerCase().includes(q);
      const matchCode = r.course_code.toLowerCase().includes(q);
      const matchCourse = r.course_name.toLowerCase().includes(q);
      const matchSid = r.student_id.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchCourse && !matchSid) return false;
    }
    if (filterSemester && r.semester !== filterSemester) return false;
    if (filterGrade && r.grade !== filterGrade) return false;
    return true;
  });

  function openAdd() {
    setEditing(null);
    setFormData({ student_id: '', course_id: '', score: '', semester: 'First Semester', academic_year: '2024/2025', remarks: '' });
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(r) {
    setEditing(r);
    setFormData({
      student_id: String(r.student_id),
      course_id: String(r.course_id),
      score: String(r.score),
      semester: r.semester,
      academic_year: r.academic_year,
      remarks: r.remarks || ''
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const payload = { ...formData, student_id: Number(formData.student_id), course_id: Number(formData.course_id), score: Number(formData.score) };
      if (editing) {
        await api.updateResult(editing.id, payload);
      } else {
        await api.createResult(payload);
      }
      setModalOpen(false);
      await loadAll();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteResult(id);
      setDeleteConfirm(null);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Results</h2>
          <p className="page-subtext">View and manage all student results</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Result</button>
      </div>

      <div className="filters filters-multi">
        <input type="text" className="search-input" placeholder="Search student or course..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="filter-select" value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}>
          <option value="">All Semesters</option>
          <option value="First Semester">First Semester</option>
          <option value="Second Semester">Second Semester</option>
        </select>
        <select className="filter-select" value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)}>
          <option value="">All Grades</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
          <option value="F">F</option>
        </select>
        <span className="filter-count">{filtered.length} results</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-body card-no-padding">
          {loading ? (
            <div className="loading-state"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <p>No results found. {search || filterSemester || filterGrade ? 'Try adjusting filters.' : 'Add your first result!'}</p>
              {!(search || filterSemester || filterGrade) && <button className="btn btn-primary" onClick={openAdd}>Add Result</button>}
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Dept / Level</th>
                    <th>Course</th>
                    <th>Score</th>
                    <th>Grade</th>
                    <th>Semester / Year</th>
                    <th className="actions-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Link to={`/students/${r.student_id}`} className="student-name">
                          <div><strong>{r.first_name} {r.last_name}</strong></div>
                          <div className="mono small-text">{r.student_id}</div>
                        </Link>
                      </td>
                      <td>
                        <span className="tag tag-sm">{r.department || '—'}</span>
                        <span className="small-text"> {r.level || ''}</span>
                      </td>
                      <td>
                        <div className="mono"><strong>{r.course_code}</strong></div>
                        <div className="small-text">{r.course_name}</div>
                      </td>
                      <td className="score-cell">{r.score}</td>
                      <td><GradeBadge grade={r.grade} /></td>
                      <td className="small-text">{r.semester}<br />{r.academic_year}</td>
                      <td className="actions-col">
                        <button className="btn btn-sm btn-outline" onClick={() => openEdit(r)}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => setDeleteConfirm(r)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Result' : 'Add New Result'}>
        {formError && <div className="alert alert-error">{formError}</div>}
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group form-full">
            <label>Student *</label>
            <select required value={formData.student_id} onChange={e => setFormData({ ...formData, student_id: e.target.value })} disabled={!!editing}>
              <option value="">Select a student...</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.student_id} - {s.first_name} {s.last_name}</option>
              ))}
            </select>
          </div>
          <div className="form-group form-full">
            <label>Course *</label>
            <select required value={formData.course_id} onChange={e => setFormData({ ...formData, course_id: e.target.value })} disabled={!!editing}>
              <option value="">Select a course...</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.course_code} - {c.course_name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Score (0-100) *</label>
            <input type="number" min="0" max="100" step="0.01" required value={formData.score} onChange={e => setFormData({ ...formData, score: e.target.value })} placeholder="85" />
          </div>
          <div className="form-group">
            <label>Semester *</label>
            <select required value={formData.semester} onChange={e => setFormData({ ...formData, semester: e.target.value })}>
              <option value="First Semester">First Semester</option>
              <option value="Second Semester">Second Semester</option>
            </select>
          </div>
          <div className="form-group form-full">
            <label>Academic Year *</label>
            <input required value={formData.academic_year} onChange={e => setFormData({ ...formData, academic_year: e.target.value })} placeholder="2024/2025" list="years2" />
            <datalist id="years2">
              <option value="2024/2025" /><option value="2023/2024" /><option value="2022/2023" />
            </datalist>
          </div>
          <div className="form-group form-full">
            <label>Remarks</label>
            <textarea value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} rows="2" placeholder="Optional remarks..." />
          </div>
          <div className="form-actions form-full">
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : (editing ? 'Update Result' : 'Add Result')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Deletion" size="sm">
        <p>Are you sure you want to delete this result?</p>
        <div className="form-actions">
          <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
