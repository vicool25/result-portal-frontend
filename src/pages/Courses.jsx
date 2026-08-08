import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import Modal from '../components/Modal';

const emptyCourse = { course_code: '', course_name: '', credit_hours: 3, department: '' };

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(emptyCourse);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { loadCourses(); }, []);

  async function loadCourses() {
    try {
      setLoading(true);
      const data = await api.getCourses({});
      setCourses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = courses?.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.course_code.toLowerCase().includes(q) ||
      c.course_name.toLowerCase().includes(q) ||
      (c.department && c.department.toLowerCase().includes(q))
    );
  });

  function openAdd() {
    setEditing(null);
    setFormData(emptyCourse);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(c) {
    setEditing(c);
    setFormData({ ...emptyCourse, ...c });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const payload = { ...formData, credit_hours: Number(formData.credit_hours) || 3 };
      if (editing) {
        await api.updateCourse(editing.id, payload);
      } else {
        await api.createCourse(payload);
      }
      setModalOpen(false);
      await loadCourses();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteCourse(id);
      setDeleteConfirm(null);
      await loadCourses();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Courses</h2>
          <p className="page-subtext">Manage course catalog and offerings</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Course</button>
      </div>

      <div className="filters">
        <input type="text" className="search-input" placeholder="Search by code, name, or department..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <span className="filter-count">{filtered.length} courses</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-body card-no-padding">
          {loading ? (
            <div className="loading-state"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📖</div>
              <p>{search ? 'No courses match your search' : 'No courses yet. Add your first course!'}</p>
              {!search && <button className="btn btn-primary" onClick={openAdd}>Add Course</button>}
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Course Name</th>
                    <th>Credit Hours</th>
                    <th>Department</th>
                    <th className="actions-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id}>
                      <td className="mono"><strong>{c.course_code}</strong></td>
                      <td>{c.course_name}</td>
                      <td>{c.credit_hours}</td>
                      <td><span className="tag">{c.department || '—'}</span></td>
                      <td className="actions-col">
                        <button className="btn btn-sm btn-outline" onClick={() => openEdit(c)}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => setDeleteConfirm(c)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Course' : 'Add New Course'}>
        {formError && <div className="alert alert-error">{formError}</div>}
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label>Course Code *</label>
            <input required value={formData.course_code} onChange={e => setFormData({ ...formData, course_code: e.target.value })} placeholder="CS101" />
          </div>
          <div className="form-group">
            <label>Credit Hours</label>
            <input type="number" min="1" max="10" value={formData.credit_hours} onChange={e => setFormData({ ...formData, credit_hours: e.target.value })} placeholder="3" />
          </div>
          <div className="form-group form-full">
            <label>Course Name *</label>
            <input required value={formData.course_name} onChange={e => setFormData({ ...formData, course_name: e.target.value })} placeholder="Introduction to Programming" />
          </div>
          <div className="form-group form-full">
            <label>Department</label>
            <input value={formData.department || ''} onChange={e => setFormData({ ...formData, department: e.target.value })} placeholder="Computer Science" />
          </div>
          <div className="form-actions form-full">
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : (editing ? 'Update Course' : 'Add Course')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Deletion" size="sm">
        <p>Are you sure you want to delete course <strong>{deleteConfirm?.course_code}</strong> - {deleteConfirm?.course_name}?</p>
        <div className="form-actions">
          <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
