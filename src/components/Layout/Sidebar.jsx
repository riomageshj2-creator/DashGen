import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Activity, Archive, PenTool } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Sidebar({ user, onSignOut, isOpen, onClose }) {
  const location = useLocation();

  const getInitials = (email) => {
    if (!email) return '?';
    return email.charAt(0).toUpperCase();
  };

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Activity size={20} />
          </div>
          <div className="sidebar-brand">
            <h2>DashGen</h2>
            <span>Analytics Platform</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/"
            className={({ isActive }) => `sidebar-link ${isActive && location.pathname !== '/history' ? 'active' : ''}`}
            onClick={onClose}
          >
            <LayoutDashboard size={18} />
            Generate Dashboard
          </NavLink>
          <NavLink
            to="/manual"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <PenTool size={18} />
            Manual Entry
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Archive size={18} />
            Saved History
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '0 4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: '600' }}>Theme</span>
            <ThemeToggle />
          </div>

          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {getInitials(user?.email)}
            </div>
            <div className="sidebar-user-info">
              <p>{displayName}</p>
              <span>{user?.email}</span>
            </div>
            <button
              id="logout-btn"
              className="btn-icon"
              onClick={onSignOut}
              title="Sign out"
              style={{ width: '32px', height: '32px', flexShrink: 0 }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
