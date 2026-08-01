import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
}

function GradeBadge({ grade }) {
  const colors = {
    A: 'grade-a',
    B: 'grade-b',
    C: 'grade-c',
    D: 'grade-d',
    F: 'grade-f',
  };
  return <span className={`grade-badge ${colors[grade] || ''}`}>{grade}</span>;
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="loading-skeleton"><div className="skeleton-card" /><div className="skeleton-card" /><div className="skeleton-card" /></div>;
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  const maxDeptCount = Math.max(...stats.departments.map(d => d.count), 1);
  const maxGradeCount = Math.max(...stats.gradeDistribution.map(g => g.count), 1);

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <StatCard icon="🎓" label="Total Students" value={stats.totalStudents} color="blue" />
        <StatCard icon="📖" label="Total Courses" value={stats.totalCourses} color="green" />
        <StatCard icon="📝" label="Total Results" value={stats.totalResults} color="purple" />
        <StatCard icon="👥" label="Total Users" value={stats.totalUsers} color="orange" />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3>Students by Department</h3>
          </div>
          <div className="card-body">
            {stats.departments.length === 0 ? (
              <p className="empty-text">No data available</p>
            ) : (
              <div className="chart-list">
                {stats.departments.map((d) => (
                  <div key={d.department} className="chart-item">
                    <div className="chart-item-label">
                      <span>{d.department || 'Unassigned'}</span>
                      <strong>{d.count}</strong>
                    </div>
                    <div className="chart-bar">
                      <div className="chart-bar-fill" style={{ width: `${(d.count / maxDeptCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Grade Distribution</h3>
          </div>
          <div className="card-body">
            {stats.gradeDistribution.length === 0 ? (
              <p className="empty-text">No data available</p>
            ) : (
              <div className="grade-distribution">
                {['A', 'B', 'C', 'D', 'F'].map((grade) => {
                  const data = stats.gradeDistribution.find(g => g.grade === grade);
                  const count = data?.count || 0;
                  return (
                    <div key={grade} className="grade-dist-item">
                      <GradeBadge grade={grade} />
                      <div className="grade-bar">
                        <div
                          className={`grade-bar-fill grade-fill-${grade.toLowerCase()}`}
                          style={{ height: `${(count / maxGradeCount) * 100}%` }}
                        />
                      </div>
                      <span className="grade-count">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Top Performing Students</h3>
          </div>
          <div className="card-body">
            {stats.topStudents.length === 0 ? (
              <p className="empty-text">No data available</p>
            ) : (
              <div className="top-students">
                {stats.topStudents.map((s, i) => (
                  <Link
                    key={s.id}
                    to={`/students/${s.id}`}
                    className="top-student-item"
                  >
                    <span className="rank">{i + 1}</span>
                    <div className="student-brief">
                      <strong>{s.first_name} {s.last_name}</strong>
                      <span>{s.department} • {s.level}</span>
                    </div>
                    <div className="gpa-display">
                      <strong>{s.avg_gpa}</strong>
                      <span>GPA</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Recent Results</h3>
          </div>
          <div className="card-body">
            {stats.recentResults.length === 0 ? (
              <p className="empty-text">No results yet</p>
            ) : (
              <div className="recent-results">
                {stats.recentResults.map((r) => (
                  <div key={r.id} className="recent-result-item">
                    <div className="result-info">
                      <strong>{r.first_name} {r.last_name}</strong>
                      <span>{r.course_code}: {r.course_name}</span>
                    </div>
                    <div className="result-grade">
                      <span className="score">{r.score}</span>
                      <GradeBadge grade={r.grade} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
