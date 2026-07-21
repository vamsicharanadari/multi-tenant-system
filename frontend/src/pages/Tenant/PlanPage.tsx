import React from 'react';
import { FeatureGate } from '../../components/FeatureGate';

export const PlanPage: React.FC = () => {
  return (
    <div style={{ maxWidth: '650px', background: '#fff', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <h2 style={{ marginTop: 0, color: '#0f172a' }}>⚡ Subscription & Feature Flags</h2>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Plan capabilities and feature gating status for this tenant workspace.
      </p>

      <FeatureGate flag="advanced_analytics" userPlanFlags={["advanced_analytics"]}>
        <div style={{ padding: '1.25rem', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
          <h3 style={{ color: '#0369a1', margin: '0 0 0.5rem 0' }}>PRO PLAN ACTIVE ⚡</h3>
          <p style={{ margin: 0, color: '#334155', fontSize: '0.9rem' }}>
            Advanced Analytics module enabled.
          </p>
        </div>
      </FeatureGate>
    </div>
  );
};
