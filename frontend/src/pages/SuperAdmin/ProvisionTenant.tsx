import React, { useState } from 'react';

export const ProvisionTenantPage: React.FC<{ token: string; onTenantCreated: () => void }> = ({ token, onTenantCreated }) => {
  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [planTier, setPlanTier] = useState('basic');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);
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
      setMsg(`Tenant "${data.name}" (${data.subdomain}) successfully provisioned! Isolated DB: ${data.db_connection_uri}`);
      setName('');
      setSubdomain('');
      setAdminEmail('');
      setAdminPassword('');
      onTenantCreated();
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', background: '#fff', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <h2 style={{ marginTop: 0, color: '#0f172a' }}>🏗 Provision New Tenant Database</h2>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Creates a dedicated PostgreSQL database instance, applies tenant DDL schema, and seeds initial Tenant Admin account.
      </p>

      {msg && (
        <div style={{
          padding: '0.85rem 1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          background: msg.startsWith('Error') ? '#fef2f2' : '#f0fdf4',
          color: msg.startsWith('Error') ? '#991b1b' : '#166534',
          border: msg.startsWith('Error') ? '1px solid #fca5a5' : '1px solid #86efac',
          fontSize: '0.9rem'
        }}>
          {msg}
        </div>
      )}

      <form onSubmit={handleProvision}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Company / Tenant Name</label>
          <input type="text" placeholder="Acme Real Estate" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Subdomain Slug</label>
          <input type="text" placeholder="acme" value={subdomain} onChange={(e) => setSubdomain(e.target.value.toLowerCase().trim())} required style={inputStyle} />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Subscription Plan Tier</label>
          <select value={planTier} onChange={(e) => setPlanTier(e.target.value)} style={inputStyle}>
            <option value="basic">Basic Tier (Standard Features)</option>
            <option value="pro">Pro Tier (Advanced Analytics Included)</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Tenant Admin Email</label>
          <input type="email" placeholder="admin@acme.com" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required style={inputStyle} />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={labelStyle}>Tenant Admin Initial Password</label>
          <input type="password" placeholder="••••••••" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required style={inputStyle} />
        </div>

        <button type="submit" disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Creating Database & Schema...' : 'Provision Dedicated Database'}
        </button>
      </form>
    </div>
  );
};

const labelStyle = { display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#334155' };
const inputStyle = { width: '100%', padding: '0.7rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' as const, fontSize: '0.9rem' };
const btnStyle = { width: '100%', padding: '0.75rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' };
