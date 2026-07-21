import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeProvider';
import { FeatureGate } from './components/FeatureGate';
import { Login } from './pages/Login';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';

const AppContent: React.FC = () => {
  const { config } = useTheme();
  const [token, setToken] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [impersonatedToken, setImpersonatedToken] = useState<string | null>(null);

  if (!token && !impersonatedToken) {
    return <Login onLoginSuccess={(t, superAdmin) => { setToken(t); setIsSuperAdmin(superAdmin); }} />;
  }

  if (isSuperAdmin && !impersonatedToken) {
    return (
      <div>
        <header className="navbar">
          <h2>Super Admin Portal</h2>
          <button onClick={() => { setToken(null); setIsSuperAdmin(false); }} style={{ padding: '0.5rem 1rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Sign Out</button>
        </header>
        <SuperAdminDashboard token={token!} onImpersonate={(impT) => setImpersonatedToken(impT)} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="navbar">
        <h2>{config.app_title}</h2>
        <div>
          {impersonatedToken && <span style={{ background: '#f59e0b', padding: '0.25rem 0.5rem', borderRadius: '4px', marginRight: '1rem', fontSize: '0.8rem' }}>Impersonating User</span>}
          <button onClick={() => { setToken(null); setImpersonatedToken(null); setIsSuperAdmin(false); }} style={{ padding: '0.5rem 1rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Sign Out</button>
        </div>
      </header>
      <main className="main-content">
        <h3>Tenant Dashboard</h3>
        <p>Dynamic White-Labeling & Feature Gating active for tenant.</p>
        
        <FeatureGate flag="advanced_analytics" userPlanFlags={["advanced_analytics"]}>
          <div style={{ padding: '1rem', background: '#e0f2fe', borderRadius: '8px', marginTop: '1rem' }}>
            <h4>Advanced Analytics Widget</h4>
            <p>Real-time tenant metrics rendered.</p>
          </div>
        </FeatureGate>
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
