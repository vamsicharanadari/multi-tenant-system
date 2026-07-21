import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeProvider';
import { FeatureGate } from '../components/FeatureGate';

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

export const TenantDashboard: React.FC<{ token: string; userRole: string }> = ({ token, userRole }) => {
  const { config } = useTheme();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [invites, setInvites] = useState<InvitationItem[]>([]);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [msg, setMsg] = useState('');

  const headers = { 'Authorization': `Bearer ${token}` };

  const fetchUsersAndInvites = () => {
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
    fetchUsersAndInvites();
  }, [token]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
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
      setMsg(`Invitation created for ${data.email}! Invite Token: ${data.token}`);
      setInviteEmail('');
      fetchUsersAndInvites();
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '1.5rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <h2 style={{ color: 'var(--color-primary, #2563eb)' }}>{config.app_title} - Tenant Workspace</h2>
      {msg && <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem' }}>{msg}</div>}

      {/* User Management & Invitations Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div>
          <h3>Active Users</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {users.map((u) => (
              <li key={u.id} style={{ padding: '0.6rem 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{u.full_name}</strong> <span style={{ color: '#64748b', fontSize: '0.85rem' }}>({u.email})</span>
                </div>
                <span style={{ background: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>{u.role}</span>
              </li>
            ))}
          </ul>

          {invites.length > 0 && (
            <>
              <h4>Pending Invitations</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {invites.map((inv) => (
                  <li key={inv.id} style={{ padding: '0.4rem 0', color: '#64748b', fontSize: '0.9rem' }}>
                    ✉️ {inv.email} - Role: <strong>{inv.role}</strong>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Invite Form for Admins */}
        <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          <h3>Invite New User</h3>
          {userRole === 'Admin' || userRole === 'SuperAdmin' ? (
            <form onSubmit={handleSendInvite}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>Email Address</label>
                <input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>Assigned Role</label>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} style={inputStyle}>
                  <option value="Admin">Admin</option>
                  <option value="Member">Member</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
              <button type="submit" style={btnStyle}>Send Invite</button>
            </form>
          ) : (
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Only Tenant Admins have permission to invite new members.</p>
          )}
        </div>
      </div>

      {/* Feature Gate Section */}
      <FeatureGate flag="advanced_analytics" userPlanFlags={["advanced_analytics"]}>
        <div style={{ padding: '1.25rem', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
          <h3 style={{ color: '#0369a1', margin: '0 0 0.5rem 0' }}>📊 Advanced Analytics Dashboard</h3>
          <p style={{ margin: 0, color: '#334155' }}>Real-time domain business metrics enabled for this plan tier.</p>
        </div>
      </FeatureGate>
    </div>
  );
};

const inputStyle = { width: '100%', padding: '0.6rem', marginBottom: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' as const };
const btnStyle = { width: '100%', padding: '0.7rem', background: 'var(--color-primary, #2563eb)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' };
