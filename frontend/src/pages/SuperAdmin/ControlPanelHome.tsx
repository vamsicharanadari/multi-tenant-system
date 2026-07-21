import React, { useState, useEffect } from 'react';

export const ControlPanelHome: React.FC<{ token: string; onNavigate: (tab: string) => void }> = ({ token, onNavigate }) => {
  const [tenantsCount, setTenantsCount] = useState(0);

  useEffect(() => {
    fetch('/api/v1/super-admin/tenants', { headers: { 'Authorization': `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setTenantsCount(data.length))
      .catch((err) => console.error(err));
  }, [token]);

  return (
    <div>
      <h2 style={{ marginTop: 0, color: '#0f172a' }}>Control Plane Dashboard Overview</h2>
      <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem' }}>
        System metrics and administrative quick actions.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={cardStyle}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>ACTIVE TENANT DATABASES</span>
          <h1 style={{ margin: '0.5rem 0 0 0', color: '#2563eb', fontSize: '2.5rem' }}>{tenantsCount}</h1>
        </div>
        <div style={cardStyle}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>CONTROL PLANE STATUS</span>
          <h1 style={{ margin: '0.5rem 0 0 0', color: '#166534', fontSize: '1.75rem' }}>🟢 Operational</h1>
        </div>
        <div style={cardStyle}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>DATABASE ISOLATION</span>
          <h1 style={{ margin: '0.5rem 0 0 0', color: '#0f172a', fontSize: '1.75rem' }}>PostgreSQL DDL</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ ...cardStyle, cursor: 'pointer' }} onClick={() => onNavigate('provision')}>
          <h3 style={{ marginTop: 0, color: '#0f172a' }}>🏗 Provision New Tenant</h3>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>
            Spin up a new isolated PostgreSQL catalog, set up Alembic DDL tables, and create tenant admin credentials.
          </p>
        </div>
        <div style={{ ...cardStyle, cursor: 'pointer' }} onClick={() => onNavigate('impersonate')}>
          <h3 style={{ marginTop: 0, color: '#0f172a' }}>🔑 God-Mode Impersonation</h3>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>
            Select target tenant and user from dropdown selectors to generate an audited 15-minute access token.
          </p>
        </div>
      </div>
    </div>
  );
};

const cardStyle = {
  background: '#ffffff',
  padding: '1.5rem',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
};
