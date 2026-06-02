import React from 'react';
import './PageHeader.css';

export default function PageHeader({ icon, title, subtitle, action, color = 'var(--primary)' }) {
  return (
    <div className="page-header">
      <div className="page-header-left">
        <div className="page-icon-box" style={{ background: color + '18', color }}>
          {icon}
        </div>
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </div>
  );
}
