import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeProvider';
import { Login } from './pages/Login';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { TenantDashboard } from './pages/TenantDashboard';
import { AcceptInvite } from './pages/AcceptInvite';

const AppContent: React.FC = () => {
  const { config } = useTheme();
  const [token, setToken] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [impersonatedToken, setImpersonatedToken] = useState<string | null>(null);
  const [showAcceptInvite, setShowAcceptInvite] = useState<boolean>(
    window.location.search.includes('token=')
  );

  const hostname = window.location.hostname;
  const isTenantSubdomain = hostname.includes('.') && !hostname.startsWith('localhost') && !hostname.startsWith('127.0.0.1');

  const tokenParam = new URLSearchParams(window.location.search).get('token') || '';

  if (showAcceptInvite) {
    return <AcceptInvite tokenParam={tokenParam} onAccepted={() => setShowAcceptInvite(false)} />;
  }

  if (!token && !impersonatedToken) {
    return (
      <Login
        onLoginSuccess={(t, superAdmin) => { setToken(t); setIsSuperAdmin(superAdmin); }}
        onGoToAcceptInvite={() => setShowAcceptInvite(true)}
      />
    );
  }

  if (isSuperAdmin && !isTenantSubdomain && !impersonatedToken) {
    return (
      <div>
        <header className="navbar">
          <h2>Super Admin Control Plane Portal</h2>
          <button onClick={() => { setToken(null); setIsSuperAdmin(false); }} style={{ padding: '0.5rem 1rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Sign Out</button>
        </header>
        <SuperAdminDashboard token={token!} onImpersonate={(impT) => setImpersonatedToken(impT)} />
      </div>
    );
  }

  const activeToken = impersonatedToken || token!;

  return (
    <div className="app-container">
      <header className="navbar">
        <h2>{config.app_title}</h2>
        <div>
          {impersonatedToken && <span style={{ background: '#f59e0b', color: '#fff', padding: '0.25rem 0.6rem', borderRadius: '4px', marginRight: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>Impersonating Tenant</span>}
          <button onClick={() => { setToken(null); setImpersonatedToken(null); setIsSuperAdmin(false); }} style={{ padding: '0.5rem 1rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Sign Out</button>
        </div>
      </header>
      <main className="main-content">
        <TenantDashboard token={activeToken} userRole={isSuperAdmin ? 'SuperAdmin' : 'Admin'} />
      </main>
    </div>
  );
};

export const App: React.FC = () => (
  <ThemeProvider>
    <AppContent />
  </ThemeProvider>
);

export default App;
