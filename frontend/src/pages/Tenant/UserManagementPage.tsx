import React, { useState, useEffect } from 'react';

interface UserItem {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface InvitationItem {
  id: string;
  email: string;
  role: string;
  token: string;
}

export const UserManagementPage: React.FC<{ token: string }> = ({ token }) => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [invites, setInvites] = useState<InvitationItem[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const headers = { 'Authorization': `Bearer ${token}` };

  const fetchData = () => {
    fetch('/api/v1/users', { headers })
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setUsers(data))
      .catch((err) => console.error(err));

    fetch('/api/v1/invitations', { headers })
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setInvites(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/v1/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Invitation failed');
      setMsg(`Invitation created for ${data.email}! Token: ${data.token}`);
      setInviteEmail('');
      fetchData();
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginTop: 0, color: '#0f172a' }}>👥 User Management & Invitations</h2>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Invite new team members, assign roles (Admin, Member, Viewer), and manage active tenant accounts.
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Active Users & Pending Invites List */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3>Active Team Members ({users.length})</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0' }}>
            {users.map((u) => (
              <li key={u.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{u.full_name}</strong>
                  <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{u.email}</div>
                </div>
                <span style={{ background: '#e2e8f0', color: '#334155', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{u.role}</span>
              </li>
            ))}
          </ul>

          {invites.length > 0 && (
            <>
              <h3>Pending Invitations ({invites.length})</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {invites.map((inv) => (
                  <li key={inv.id} style={{ padding: '0.5rem 0', borderBottom: '1px dotted #e2e8f0', color: '#64748b', fontSize: '0.85rem' }}>
                    ✉️ {inv.email} &bull; Role: <strong>{inv.role}</strong>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Send Invitation Form */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3>Invite New Member</h3>
          <form onSubmit={handleSendInvite}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Colleague Email Address</label>
              <input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Assigned Role</label>
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} style={inputStyle}>
                <option value="Admin">Tenant Admin (Full Management)</option>
                <option value="Member">Member (Standard Read/Write)</option>
                <option value="Viewer">Viewer (Read-Only)</option>
              </select>
            </div>
            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? 'Generating Invite Token...' : 'Send Invitation'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#334155' };
const inputStyle = { width: '100%', padding: '0.7rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' as const, fontSize: '0.9rem' };
const btnStyle = { width: '100%', padding: '0.75rem', backgroundColor: 'var(--color-primary, #2563eb)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' };
