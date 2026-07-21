import React, { useState, useEffect } from 'react';
import { TenantSidebar } from '../../components/TenantSidebar';
import { UserManagementPage } from './UserManagementPage';
import { BrandingPage } from './BrandingPage';
import { PlanPage } from './PlanPage';
import { useTheme } from '../../context/ThemeProvider';

export const TenantControlPanel: React.FC<{ token: string; initialTab?: string; onSignOut: () => void }> = ({ token, initialTab = 'overview', onSignOut }) => {
  const { config } = useTheme();
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <TenantSidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onSignOut={onSignOut}
        tenantName={config.app_title}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '1rem 2rem', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.9rem' }}>
            Tenant Control Panel &gt; {activeTab.toUpperCase()}
          </span>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState({}, '', '/');
              window.dispatchEvent(new Event('popstate'));
            }}
            style={{ color: 'var(--color-primary, #2563eb)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}
          >
            🏠 Main Dashboard
          </a>
        </header>

        <main style={{ padding: '2rem', flex: 1 }}>
          {activeTab === 'overview' && (
            <div>
              <h2 style={{ marginTop: 0, color: '#0f172a' }}>Tenant Workspace Overview</h2>
              <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem' }}>
                Welcome to your tenant control console. Use the left menu to manage users, invitations, and workspace settings.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={cardStyle} onClick={() => { setActiveTab('users'); window.history.pushState({}, '', '/control-panel/users'); }}>
                  <h3 style={{ marginTop: 0, color: 'var(--color-primary, #2563eb)' }}>👥 User Management</h3>
                  <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>View active team members and invite new users with Admin/Member/Viewer roles.</p>
                </div>
                <div style={cardStyle} onClick={() => { setActiveTab('branding'); window.history.pushState({}, '', '/control-panel/branding'); }}>
                  <h3 style={{ marginTop: 0, color: 'var(--color-primary, #2563eb)' }}>🎨 Branding & Theme</h3>
                  <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>Review custom white-label colors and dynamic portal title configuration.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && <UserManagementPage token={token} />}
          {activeTab === 'branding' && <BrandingPage />}
          {activeTab === 'plan' && <PlanPage />}
        </main>
      </div>
    </div>
  );
};

const cardStyle = {
  background: '#ffffff',
  padding: '1.5rem',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  cursor: 'pointer'
};
