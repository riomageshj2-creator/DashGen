import { Menu, Activity } from 'lucide-react';

export default function Navbar({ onMenuClick }) {
  return (
    <div className="navbar-mobile">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="btn-icon" onClick={onMenuClick} id="mobile-menu-btn">
          <Menu size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="sidebar-logo" style={{ width: '32px', height: '32px' }}>
            <Activity size={16} />
          </div>
          <span style={{ fontWeight: '700', fontSize: '15px' }}>DashGen</span>
        </div>
      </div>
    </div>
  );
}
