import React, { useState } from 'react';

export const SuperAdminDashboard: React.FC<{ token: string; onImpersonate: (impToken: string) => void }> = ({ token, onImpersonate }) => {
  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [planTier, setPlanTier] = useState('basic');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [msg, setMsg] = useState('');

  const [targetTenantId, setTargetTenantId] = useState('');
  const [targetUserId, setTargetUserId] = useState('');

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await fetch('/api/v1/super-admin/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
      setMsg(`Tenant ${data.subdomain} created! DB URI: ${data.db_connection_uri}`);
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const handleImpersonate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await fetch('/api/v1/super-admin/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          target_tenant_id: targetTenantId,
          target_user_id: targetUserId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Impersonation failed');
      onImpersonate(data.access_token);
      setMsg(`Impersonating tenant ${targetTenantId}...`);
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1.5rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <h2 style={{ color: '#1e293b' }}>Super Admin Control Plane</h2>
      {msg && <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>{msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <form onSubmit={handleProvision} style={{ borderRight: '1px solid #e2e8f0', paddingRight: '2rem' }}>
          <h3>Provision New Tenant</h3>
          <input type="text" placeholder="Tenant Name" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
          <input type="text" placeholder="Subdomain" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} required style={inputStyle} />
          <select value={planTier} onChange={(e) => setPlanTier(e.target.value)} style={inputStyle}>
            <option value="basic">Basic Plan</option>
            <option value="pro">Pro Plan</option>
          </select>
          <input type="email" placeholder="Tenant Admin Email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required style={inputStyle} />
          <input type="password" placeholder="Tenant Admin Password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required style={inputStyle} />
          <button type="submit" style={btnStyle}>Provision Database</button>
        </form>

        <form onSubmit={handleImpersonate}>
          <h3>God-Mode Impersonation</h3>
          <input type="text" placeholder="Target Tenant ID" value={targetTenantId} onChange={(e) => setTargetTenantId(e.target.value)} required style={inputStyle} />
          <input type="text" placeholder="Target User ID" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} required style={inputStyle} />
          <button type="submit" style={{ ...btnStyle, backgroundColor: '#dc2626' }}>Impersonate User</button>
        </form>
      </div>
    </div>
  );
};

const inputStyle = { width: '100%', padding: '0.6rem', marginBottom: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' as const };
const btnStyle = { width: '100%', padding: '0.75rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' };
