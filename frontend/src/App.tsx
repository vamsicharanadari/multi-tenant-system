import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeProvider';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Sidebar } from './components/Sidebar';
import { ControlPanelHome } from './pages/SuperAdmin/ControlPanelHome';
import { ProvisionTenantPage } from './pages/SuperAdmin/ProvisionTenant';
import { ImpersonateUserPage } from './pages/SuperAdmin/ImpersonateUser';
import { TenantControlPanel } from './pages/Tenant/TenantControlPanel';
import { MemberDashboard } from './pages/Tenant/MemberDashboard';
import { AcceptInvite } from './pages/AcceptInvite';

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function getTabFromPath(path: string): string {
  if (path.includes('/provision')) return 'provision';
  if (path.includes('/impersonate')) return 'impersonate';
  if (path.includes('/users')) return 'users';
  if (path.includes('/branding')) return 'branding';
  if (path.includes('/plan')) return 'plan';
  return 'overview';
}

const AppContent: React.FC = () => {
  const { config } = useTheme();
  
  // Persist session tokens in localStorage
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem('token'));
  const [impersonatedToken, setImpersonatedTokenState] = useState<string | null>(() => localStorage.getItem('impersonatedToken'));
  const [isSuperAdmin, setIsSuperAdminState] = useState<boolean>(() => localStorage.getItem('isSuperAdmin') === 'true');
  
  const [userRole, setUserRole] = useState<string>('Member');
  const [userEmail, setUserEmail] = useState<string>('');
  const [showAcceptInvite, setShowAcceptInvite] = useState<boolean>(
    window.location.search.includes('token=')
  );

  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);
  const [adminTab, setAdminTab] = useState<string>(() => getTabFromPath(window.location.pathname));

  const setToken = (t: string | null) => {
    if (t) localStorage.setItem('token', t);
    else localStorage.removeItem('token');
    setTokenState(t);
  };

  const setImpersonatedToken = (t: string | null) => {
    if (t) localStorage.setItem('impersonatedToken', t);
    else localStorage.removeItem('impersonatedToken');
    setImpersonatedTokenState(t);
  };

  const setIsSuperAdmin = (flag: boolean) => {
    localStorage.setItem('isSuperAdmin', String(flag));
    setIsSuperAdminState(flag);
  };

  const handleSignOut = () => {
    setToken(null);
    setImpersonatedToken(null);
    setIsSuperAdmin(false);
    localStorage.clear();
    navigateTo('/');
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      setCurrentPath(path);
      setAdminTab(getTabFromPath(path));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const activeT = impersonatedToken || token;
    if (activeT) {
      const claims = parseJwt(activeT);
      if (claims) {
        if (claims.exp && claims.exp * 1000 < Date.now()) {
          handleSignOut();
          return;
        }
        setUserRole(claims.role || 'Member');
        setUserEmail(claims.email || claims.sub || '');
        if (claims.is_super_admin && !impersonatedToken) {
          setIsSuperAdminState(true);
        }
      }
    }
  }, [token, impersonatedToken]);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    setAdminTab(getTabFromPath(path));
  };

  const hostname = window.location.hostname;
  const isTenantSubdomain = hostname.includes('.') && !hostname.startsWith('localhost') && !hostname.startsWith('127.0.0.1');

  const tokenParam = new URLSearchParams(window.location.search).get('token') || '';

  if (showAcceptInvite) {
    return <AcceptInvite tokenParam={tokenParam} onAccepted={() => setShowAcceptInvite(false)} />;
  }

  if (!token && !impersonatedToken) {
    return (
      <Login
        onLoginSuccess={(t, superAdmin) => {
          setImpersonatedToken(null);
          setToken(t);
          setIsSuperAdmin(superAdmin);
          const claims = parseJwt(t);
          const roleFromToken = claims?.role || (superAdmin ? 'Admin' : 'Member');
          setUserRole(roleFromToken);
          setUserEmail(claims?.email || claims?.sub || '');
          if (superAdmin && !isTenantSubdomain) {
            navigateTo('/control-panel');
          } else {
            navigateTo('/');
          }
        }}
        onGoToAcceptInvite={() => setShowAcceptInvite(true)}
      />
    );
  }

  // Super Admin Control Panel (ONLY on root control plane domain when NOT impersonating)
  if (isSuperAdmin && !isTenantSubdomain && !impersonatedToken && currentPath.startsWith('/control-panel')) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <Sidebar
          activeTab={adminTab}
          onTabChange={(tab) => {
            setAdminTab(tab);
            const subpath = tab === 'overview' ? '' : `/${tab}`;
            navigateTo(`/control-panel${subpath}`);
          }}
          onSignOut={handleSignOut}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <header style={{ padding: '1rem 2rem', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.9rem' }}>
              Super Admin Control Panel &gt; {adminTab.toUpperCase()}
            </span>
            <button onClick={() => navigateTo('/')} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.85rem' }}>
              🏠 Root Dashboard
            </button>
          </header>

          <main style={{ padding: '2rem', flex: 1 }}>
            {adminTab === 'overview' && (
              <ControlPanelHome token={token!} onNavigate={(tab) => {
                setAdminTab(tab);
                const subpath = tab === 'overview' ? '' : `/${tab}`;
                navigateTo(`/control-panel${subpath}`);
              }} />
            )}
            {adminTab === 'provision' && (
              <ProvisionTenantPage token={token!} onTenantCreated={() => {
                setAdminTab('overview');
                navigateTo('/control-panel');
              }} />
            )}
            {adminTab === 'impersonate' && (
              <ImpersonateUserPage
                token={token!}
                onImpersonate={(impT) => {
                  setImpersonatedToken(impT);
                  const impClaims = parseJwt(impT);
                  setUserRole(impClaims?.role || 'Member');
                  setUserEmail(impClaims?.email || impClaims?.sub || '');
                  navigateTo('/control-panel');
                }}
              />
            )}
          </main>
        </div>
      </div>
    );
  }

  // Root Domain Dashboard (when not impersonating)
  if (currentPath === '/' && !isTenantSubdomain && !impersonatedToken) {
    return (
      <div>
        <header className="navbar">
          <h2>{config.app_title}</h2>
          <div>
            {isSuperAdmin && (
              <button
                onClick={() => navigateTo('/control-panel')}
                style={{ padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '1rem', fontWeight: 600 }}
              >
                Control Panel
              </button>
            )}
            <button onClick={handleSignOut} style={{ padding: '0.5rem 1rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Sign Out
            </button>
          </div>
        </header>
        <Home onGoToControlPanel={() => navigateTo('/control-panel')} />
      </div>
    );
  }

  // TENANT OR IMPERSONATED WORKSPACE VIEW
  const activeToken = impersonatedToken || token!;
  const isAdminRole = userRole === 'Admin' || userRole === 'SuperAdmin';

  // Tenant Admin Control Panel at /control-panel
  if (isAdminRole && currentPath.startsWith('/control-panel')) {
    return (
      <div>
        {impersonatedToken && (
          <div style={{ background: '#fef3c7', color: '#92400e', padding: '0.65rem 1.5rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #fde68a' }}>
            <span>🔑 <strong>God-Mode Impersonation Active:</strong> Viewing Tenant Admin Console as <code>{userEmail}</code> (Role: <strong>{userRole}</strong>).</span>
            <button
              onClick={() => {
                setImpersonatedToken(null);
                setUserRole('Admin');
                setIsSuperAdmin(true);
                navigateTo('/control-panel');
              }}
              style={{ background: 'none', border: 'none', color: '#b45309', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
            >
              Exit Impersonation ➔
            </button>
          </div>
        )}
        <TenantControlPanel
          token={activeToken}
          initialTab={adminTab}
          onSignOut={handleSignOut}
        />
      </div>
    );
  }

  // Impersonation or Member View
  return (
    <div className="app-container">
      <header className="navbar">
        <h2>{config.app_title}</h2>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {impersonatedToken && (
            <button
              onClick={() => {
                setImpersonatedToken(null);
                setUserRole('Admin');
                setIsSuperAdmin(true);
                navigateTo('/control-panel');
              }}
              style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', marginRight: '1rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Exit Impersonation Mode ✖
            </button>
          )}
          {isAdminRole && (
            <button
              onClick={() => navigateTo('/control-panel')}
              style={{ padding: '0.5rem 1rem', background: 'var(--color-primary, #2563eb)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '1rem', fontWeight: 600 }}
            >
              ⚙️ Control Panel
            </button>
          )}
          <button onClick={handleSignOut} style={{ padding: '0.5rem 1rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      </header>
      {impersonatedToken && (
        <div style={{ background: '#fef3c7', color: '#92400e', padding: '0.65rem 1.5rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #fde68a' }}>
          <span>🔑 <strong>God-Mode Impersonation Active:</strong> Viewing workspace as tenant user <code>{userEmail}</code> (Role: <strong>{userRole}</strong>).</span>
          <button
            onClick={() => {
              setImpersonatedToken(null);
              setUserRole('Admin');
              setIsSuperAdmin(true);
              navigateTo('/control-panel');
            }}
            style={{ background: 'none', border: 'none', color: '#b45309', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
          >
            Exit Impersonation ➔
          </button>
        </div>
      )}
      <main className="main-content">
        {isAdminRole ? (
          <div style={{ maxWidth: '800px', margin: '3rem auto', textAlign: 'center', background: '#fff', padding: '2.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h2>Tenant Admin Workspace</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Viewing tenant workspace as <strong>{userEmail}</strong> (Role: Admin). Access user management, branding, and feature flags in the Control Panel.</p>
            <button onClick={() => navigateTo('/control-panel')} style={{ padding: '0.75rem 1.5rem', background: 'var(--color-primary, #2563eb)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
              Open Tenant Control Panel ➔
            </button>
          </div>
        ) : (
          <MemberDashboard userRole={userRole} />
        )}
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
