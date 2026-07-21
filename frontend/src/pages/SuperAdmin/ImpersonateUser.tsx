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

export const ImpersonateUserPage: React.FC<{ token: string; onImpersonate: (impToken: string) => void }> = ({ token, onImpersonate }) => {
  const [tenantList, setTenantList] = useState<TenantOption[]>([]);
  const [userList, setUserList] = useState<UserOption[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const headers = { 'Authorization': `Bearer ${token}` };

  useEffect(() => {
    fetch('/api/v1/super-admin/tenants', { headers })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTenantList(data);
          if (data.length > 0) {
            setSelectedTenantId(data[0].id);
          }
        }
      })
      .catch((err) => console.error('Error fetching tenants:', err));
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

  const handleImpersonate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    if (!selectedTenantId || !selectedUserId) {
      setMsg('Please select both a Target Tenant and Target User.');
      return;
    }

    setLoading(true);
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
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', background: '#fff', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <h2 style={{ marginTop: 0, color: '#0f172a' }}>🔑 God-Mode Account Impersonation</h2>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Generates a 15-minute audited JWT token for a specific tenant user account. All downstream actions are recorded under your Super Admin ID in audit logs.
      </p>

      {msg && (
        <div style={{ padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5', fontSize: '0.9rem' }}>
          {msg}
        </div>
      )}

      <form onSubmit={handleImpersonate}>
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={labelStyle}>Select Target Tenant Company</label>
          <select value={selectedTenantId} onChange={(e) => setSelectedTenantId(e.target.value)} style={inputStyle}>
            <option value="">-- Choose Tenant --</option>
            {tenantList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.subdomain}) [{t.plan_tier.toUpperCase()}]
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '1.75rem' }}>
          <label style={labelStyle}>Select Target User Account</label>
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

        <button
          type="submit"
          disabled={loading || !selectedTenantId || !selectedUserId}
          style={{ ...btnStyle, backgroundColor: '#dc2626', opacity: loading || !selectedTenantId || !selectedUserId ? 0.6 : 1 }}
        >
          {loading ? 'Generating Audited Token...' : 'Impersonate Selected Account'}
        </button>
      </form>
    </div>
  );
};

const labelStyle = { display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#334155' };
const inputStyle = { width: '100%', padding: '0.7rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' as const, fontSize: '0.9rem' };
const btnStyle = { width: '100%', padding: '0.75rem', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' };
