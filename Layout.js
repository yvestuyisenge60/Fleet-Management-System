import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import './Layout.css';

const nav = [
  { to: '/dashboard',   icon: '📊', label: 'Dashboard',   section: 'OVERVIEW' },
  { to: '/vehicles',    icon: '🚗', label: 'Vehicles',    section: 'FLEET' },
  { to: '/drivers',     icon: '👤', label: 'Drivers',     section: null },
  { to: '/trips',       icon: '🗺️',  label: 'Trips',       section: null },
  { to: '/fuel',        icon: '⛽', label: 'Fuel',        section: null },
  { to: '/maintenance', icon: '🔧', label: 'Maintenance', section: null },
  { to: '/users',         icon: '🔑', label: 'Users',         section: 'ADMIN' },
  { to: '/reports',       icon: '📈', label: 'Reports',       section: null },
  { to: '/daily-report',  icon: '📄', label: 'Daily Report',  section: null },
  { to: '/profile',       icon: '⚙️',  label: 'My Profile',    section: 'ACCOUNT' },
];

const routeLabels = {
  '/dashboard': 'Dashboard', '/vehicles': 'Vehicles', '/drivers': 'Drivers',
  '/trips': 'Trips', '/fuel': 'Fuel', '/maintenance': 'Maintenance',
  '/users': 'Users', '/reports': 'Reports', '/daily-report': 'Daily Report', '/profile': 'My Profile',
};

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const user = JSON.parse(localStorage.getItem('sw_user') || '{}');
  const currentLabel = routeLabels[location.pathname] || 'SwiftWheels';

  const logout = () => {
    localStorage.removeItem('sw_token');
    localStorage.removeItem('sw_user');
    navigate('/login');
  };

  return (
    <div className={`layout ${collapsed ? 'collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-wrap">🚀</div>
          <div>
            <div className="logo-text">SwiftWheels</div>
            <div className="logo-sub"> Fleet Manager</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {nav.map((item) => (
            <React.Fragment key={item.to}>
              {item.section && <div className="nav-section">{item.section}</div>}
              <NavLink
                to={item.to}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <div className="nav-icon-wrap">{item.icon}</div>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            </React.Fragment>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link to="/profile" className="user-avatar" title="My Profile" style={{ textDecoration:'none', overflow:'hidden' }}>
            {user.avatarUrl
              ? <img src={`http://localhost:5000${user.avatarUrl}`} alt="avatar"
                  style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'10px' }} />
              : (user.fullName || 'A')[0]
            }
          </Link>
          <div>
            <div className="user-name">{user.fullName || 'Administrator'}</div>
            <div className="user-role">{user.role || 'Admin'}</div>
          </div>
          <button className="logout-btn" onClick={logout} title="Logout">⏻</button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-wrapper">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setCollapsed(!collapsed)}>☰</button>
          <div className="topbar-breadcrumb">
            <span>SwiftWheels</span>
            <span>/</span>
            <strong>{currentLabel}</strong>
          </div>
          <div className="topbar-right">
            <span className="topbar-date">{new Date().toLocaleDateString('en-US', { weekday:'short', year:'numeric', month:'short', day:'numeric' })}</span>
            <span className="online-dot">Live</span>
            <Link to="/profile" className="topbar-profile-btn" title="My Profile">
              <span className="topbar-avatar">
                {user.avatarUrl
                  ? <img src={`http://localhost:5000${user.avatarUrl}`} alt="avatar"
                      style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
                  : (user.fullName || 'A')[0]
                }
              </span>
              <span className="topbar-username">{user.fullName?.split(' ')[0] || 'Admin'}</span>
            </Link>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>

        <footer className="footer">
          © 2026 SwiftWheels Fleet Management System &nbsp;—&nbsp; <strong>Created By Yves Ty</strong>
        </footer>
      </div>
    </div>
  );
}
