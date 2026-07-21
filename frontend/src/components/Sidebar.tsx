import React from 'react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSignOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onSignOut }) => {
  const menuItems = [
    { id: 'overview', label: '📊 Control Panel Overview', path: '/control-panel' },
    { id: 'provision', label: '🏗 Provision New Tenant', path: '/control-panel/provision' },
    { id: 'impersonate', label: '🔑 God-Mode Impersonation', path: '/control-panel/impersonate' },
  ];

  return (
    <aside style={{
      width: '260px',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '4px 0 10px rgba(0,0,0,0.1)'
    }}>
      <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid #1e293b' }}>
        <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.1rem' }}>Super Admin Portal</h3>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Control Plane Console</span>
      </div>

      <nav style={{ flex: 1, padding: '1rem 0' }}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onTabChange(item.id);
              window.history.pushState({}, '', item.path);
            }}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '0.85rem 1.25rem',
              backgroundColor: activeTab === item.id ? '#1e293b' : 'transparent',
              color: activeTab === item.id ? '#38bdf8' : '#cbd5e1',
              border: 'none',
              borderLeft: activeTab === item.id ? '4px solid #38bdf8' : '4px solid transparent',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: activeTab === item.id ? 600 : 400,
              transition: 'all 0.2s ease'
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div style={{ padding: '1.25rem', borderTop: '1px solid #1e293b' }}>
        <button
          onClick={onSignOut}
          style={{
            width: '100%',
            padding: '0.65rem',
            backgroundColor: '#334155',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.85rem'
          }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
};
