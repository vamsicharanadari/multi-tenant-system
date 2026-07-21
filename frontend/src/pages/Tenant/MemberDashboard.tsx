import React from 'react';
import { useTheme } from '../../context/ThemeProvider';

export const MemberDashboard: React.FC<{ userRole: string }> = ({ userRole }) => {
  const { config } = useTheme();

  return (
    <div style={{ maxWidth: '800px', margin: '4rem auto', padding: '3rem 2rem', textAlign: 'center', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🚀</div>
      <h1 style={{ color: 'var(--color-primary, #2563eb)', marginBottom: '0.5rem' }}>Welcome to {config.app_title}</h1>
      <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '2rem' }}>
        Tenant Member Workspace &bull; Logged in as <strong>{userRole}</strong>
      </p>

      <div style={{
        padding: '2rem',
        borderRadius: '12px',
        backgroundColor: '#f8fafc',
        border: '2px dashed #cbd5e1',
        display: 'inline-block',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h2 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Dashboard Coming Soon</h2>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
          Your tenant domain metrics, project tools, and custom business workflow features are currently under construction.
        </p>
      </div>
    </div>
  );
};
