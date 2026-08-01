import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import Modal from '../components/Modal';

function GradeBadge({ grade }) {
  const colors = {
    A: 'grade-a', B: 'grade-b', C: 'grade-c', D: 'grade-d', F: 'grade-f',
  };
  return <span className={`grade-badge ${colors[grade] || ''}`}>{grade}</span>;
}

const emptyStudent = { student_id: '', first_name: '', last_name: '', email: '', phone: '', department: '', level: '' };

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(emptyStudent);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    try {
      setLoading(true);
      const data = await api.getStudents({});
      setStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = students.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.first_name.toLowerCase().includes(q) ||
      s.last_name.toLowerCase().includes(q) ||
      s.student_id.toLowerCase().includes(q) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.department && s.department.toLowerCase().includes(q))
    );
  });

  function openAdd() {
    setEditing(null);
    setFormData(emptyStudent);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(student) {
    setEditing(student);
    setFormData({ ...emptyStudent, ...student });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      if (editing) {
        await api.updateStudent(editing.id, formData);
      } else {
        await api.createStudent(formData);
      }
      setModalOpen(false);
      await loadStudents();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteStudent(id);
      setDeleteConfirm(null);
      await loadStudents();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Student Records</h2>
          <p className="page-subtext">Manage and view all student information</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          + Add Student
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          className="search-input"
          placeholder="Search by name, ID, email, or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="filter-count">{filtered.length} students</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-body card-no-padding">
          {loading ? (
            <div className="loading-state"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎓</div>
              <p>{search ? 'No students match your search' : 'No students yet. Add your first student!'}</p>
              {!search && <button className="btn btn-primary" onClick={openAdd}>Add Student</button>}
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Level</th>
                    <th className="actions-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id}>
                      <td className="mono">{s.student_id}</td>
                      <td>
                        <Link to={`/students/${s.id}`} className="student-name">
                          {s.first_name} {s.last_name}
                        </Link>
                      </td>
                      <td>{s.email || '—'}</td>
                      <td><span className="tag">{s.department || '—'}</span></td>
                      <td>{s.level || '—'}</td>
                      <td className="actions-col">
                        <button className="btn btn-sm btn-outline" onClick={() => openEdit(s)}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => setDeleteConfirm(s)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Student' : 'Add New Student'}>
        {formError && <div className="alert alert-error">{formError}</div>}
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label>Student ID *</label>
            <input required value={formData.student_id} onChange={e => setFormData({ ...formData, student_id: e.target.value })} placeholder="STU001" />
          </div>
          <div className="form-group">
            <label>First Name *</label>
            <input required value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} placeholder="John" />
          </div>
          <div className="form-group">
            <label>Last Name *</label>
            <input required value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} placeholder="Doe" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="john@school.edu" />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+1234567890" />
          </div>
          <div className="form-group">
            <label>Department</label>
            <input value={formData.department || ''} onChange={e => setFormData({ ...formData, department: e.target.value })} placeholder="Computer Science" />
          </div>
          <div className="form-group form-full">
            <label>Level</label>
            <input value={formData.level || ''} onChange={e => setFormData({ ...formData, level: e.target.value })} placeholder="Level 100" list="levels" />
            <datalist id="levels">
              <option value="Level 100" />
              <option value="Level 200" />
              <option value="Level 300" />
              <option value="Level 400" />
            </datalist>
          </div>
          <div className="form-actions form-full">
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : (editing ? 'Update Student' : 'Add Student')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Deletion" size="sm">
        <p>Are you sure you want to delete student <strong>{deleteConfirm?.first_name} {deleteConfirm?.last_name}</strong> ({deleteConfirm?.student_id})? This will also remove all their results. This action cannot be undone.</p>
        <div className="form-actions">
          <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
