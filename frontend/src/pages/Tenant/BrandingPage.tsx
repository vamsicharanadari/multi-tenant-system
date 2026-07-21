import React from 'react';
import { useTheme } from '../../context/ThemeProvider';

export const BrandingPage: React.FC = () => {
  const { config } = useTheme();

  return (
    <div style={{ maxWidth: '650px', background: '#fff', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <h2 style={{ marginTop: 0, color: '#0f172a' }}>🎨 Tenant Branding & Theme Configuration</h2>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Dynamic white-label configuration applied across your tenant portal.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={colorBoxStyle}>
          <div style={{ width: '40px', height: '40px', borderRadius: '6px', backgroundColor: config.primary_color, marginBottom: '0.5rem' }} />
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Primary Brand Color</span>
          <strong>{config.primary_color}</strong>
        </div>
        <div style={colorBoxStyle}>
          <div style={{ width: '40px', height: '40px', borderRadius: '6px', backgroundColor: config.secondary_color, marginBottom: '0.5rem' }} />
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Secondary Brand Color</span>
          <strong>{config.secondary_color}</strong>
        </div>
      </div>

      <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Application Title</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>{config.app_title}</div>
      </div>
    </div>
  );
};

const colorBoxStyle = {
  padding: '1.25rem',
  background: '#f8fafc',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  display: 'flex',
  flexDirection: 'column' as const
};
