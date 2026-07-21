import React, { useState, useEffect } from 'react';

interface TenantOption {
  id: string;
  name: string;
  subdomain: string;
  plan_tier: string;
}

interface UserOption {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export const SuperAdminDashboard: React.FC<{ token: string; onImpersonate: (impToken: string) => void }> = ({ token, onImpersonate }) => {
  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [planTier, setPlanTier] = useState('basic');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [msg, setMsg] = useState('');

  const [tenantList, setTenantList] = useState<TenantOption[]>([]);
  const [userList, setUserList] = useState<UserOption[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  const headers = { 'Authorization': `Bearer ${token}` };

  const fetchTenants = () => {
    fetch('/api/v1/super-admin/tenants', { headers })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTenantList(data);
          if (data.length > 0 && !selectedTenantId) {
            setSelectedTenantId(data[0].id);
          }
        }
      })
      .catch((err) => console.error('Error fetching tenants:', err));
  };

  useEffect(() => {
    fetchTenants();
  }, [token]);

  useEffect(() => {
    if (selectedTenantId) {
      setUserList([]);
      setSelectedUserId('');
      fetch(`/api/v1/super-admin/tenants/${selectedTenantId}/users`, { headers })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setUserList(data);
            if (data.length > 0) {
              setSelectedUserId(data[0].id);
            }
          }
        })
        .catch((err) => console.error('Error fetching tenant users:', err));
    }
  }, [selectedTenantId]);

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await fetch('/api/v1/super-admin/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          name,
          subdomain,
          plan_tier: planTier,
          admin_email: adminEmail,
          admin_password: adminPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Provisioning failed');
      setMsg(`Tenant ${data.subdomain} created!`);
      setName('');
      setSubdomain('');
      setAdminEmail('');
      setAdminPassword('');
      fetchTenants();
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const handleImpersonate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    if (!selectedTenantId || !selectedUserId) {
      setMsg('Please select both a Target Tenant and Target User.');
      return;
    }

    try {
      const res = await fetch('/api/v1/super-admin/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          target_tenant_id: selectedTenantId,
          target_user_id: selectedUserId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Impersonation failed');
      onImpersonate(data.access_token);
      setMsg(`Impersonating tenant ${selectedTenantId}...`);
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '1.5rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <h2 style={{ color: '#1e293b' }}>Super Admin Control Plane</h2>
      {msg && <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem' }}>{msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Provision Tenant Section */}
        <form onSubmit={handleProvision} style={{ borderRight: '1px solid #e2e8f0', paddingRight: '2rem' }}>
          <h3>Provision New Tenant DB</h3>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={labelStyle}>Tenant Company Name</label>
            <input type="text" placeholder="Acme Corp" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={labelStyle}>Subdomain</label>
            <input type="text" placeholder="acme" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} required style={inputStyle} />
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={labelStyle}>Subscription Plan</label>
            <select value={planTier} onChange={(e) => setPlanTier(e.target.value)} style={inputStyle}>
              <option value="basic">Basic Plan</option>
              <option value="pro">Pro Plan</option>
            </select>
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={labelStyle}>Tenant Admin Email</label>
            <input type="email" placeholder="admin@acme.com" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required style={inputStyle} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Tenant Admin Password</label>
            <input type="password" placeholder="••••••••" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required style={inputStyle} />
          </div>
          <button type="submit" style={btnStyle}>Provision Database</button>
        </form>

        {/* Impersonation Dropdown Section */}
        <form onSubmit={handleImpersonate}>
          <h3>God-Mode Impersonation</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Select Target Tenant</label>
            <select value={selectedTenantId} onChange={(e) => setSelectedTenantId(e.target.value)} style={inputStyle}>
              <option value="">-- Choose Tenant --</option>
              {tenantList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.subdomain}) [{t.plan_tier.toUpperCase()}]
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Select Target User</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={!selectedTenantId || userList.length === 0}
              style={{ ...inputStyle, opacity: !selectedTenantId || userList.length === 0 ? 0.6 : 1 }}
            >
              <option value="">
                {userList.length === 0 ? '-- No Users Found --' : '-- Choose User --'}
              </option>
              {userList.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.email}) - {u.role}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" style={{ ...btnStyle, backgroundColor: '#dc2626' }} disabled={!selectedTenantId || !selectedUserId}>
            Impersonate Selected Account
          </button>
        </form>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', fontWeight: 600 };
const inputStyle = { width: '100%', padding: '0.6rem', marginBottom: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' as const };
const btnStyle = { width: '100%', padding: '0.75rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' };
