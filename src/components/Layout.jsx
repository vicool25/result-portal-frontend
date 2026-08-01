import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const navLinks = [
    { to: '/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/students', icon: '🎓', label: 'Students' },
    { to: '/courses', icon: '📖', label: 'Courses' },
    { to: '/results', icon: '📝', label: 'Results' },
  ];

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/students/') && path !== '/students') return 'Student Details';
    if (path.startsWith('/dashboard')) return 'Dashboard';
    if (path.startsWith('/students')) return 'Student Records';
    if (path.startsWith('/courses')) return 'Courses';
    if (path.startsWith('/results')) return 'Results';
    return '';
  };

  return (
    <div className="layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">📚</div>
          <div className="sidebar-brand">
            <h2>Result Portal</h2>
            <span>Management System</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{link.icon}</span>
              <span className="nav-label">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-role">{user?.role || 'Admin'}</span>
            </div>
          </div>
          <button className="btn btn-outline btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
          <h1 className="page-title">{getPageTitle()}</h1>
          <div className="topbar-right">
            <span className="welcome-text">Welcome, {user?.name?.split(' ')[0] || 'User'}</span>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>

      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
