import React from 'react';

export const Home: React.FC<{ onGoToControlPanel: () => void }> = ({ onGoToControlPanel }) => {
  return (
    <div style={{ maxWidth: '800px', margin: '4rem auto', padding: '2rem', textAlign: 'center', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      <h1 style={{ color: '#0f172a', marginBottom: '1rem' }}>Multi-Tenant System Platform</h1>
      <p style={{ color: '#64748b', fontSize: '1.05rem', marginBottom: '2rem' }}>
        Main Dashboard Workspace (Root Domain: <code>http://localhost:3003/</code>)
      </p>
      
      <button
        onClick={onGoToControlPanel}
        style={{
          padding: '0.85rem 1.75rem',
          backgroundColor: '#2563eb',
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 600,
          fontSize: '1rem',
          cursor: 'pointer',
          boxShadow: '0 4px 6px -1px rgba(37,99,235,0.3)'
        }}
      >
        Open Control Panel Portal ➔
      </button>
    </div>
  );
};
