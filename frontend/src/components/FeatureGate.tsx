import React from 'react';

interface FeatureGateProps {
  flag: string;
  userPlanFlags?: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const DefaultUpgradeBanner: React.FC<{ flag: string }> = ({ flag }) => (
  <div style={{
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FCA5A5',
    color: '#991B1B',
    margin: '1rem 0'
  }}>
    <h4 style={{ margin: '0 0 0.5rem 0' }}>Feature Locked 🔒</h4>
    <p style={{ margin: 0 }}>
      The feature <code>{flag}</code> is not included in your current subscription plan.
      Please upgrade your plan to unlock full access.
    </p>
  </div>
);

export const FeatureGate: React.FC<FeatureGateProps> = ({
  flag,
  userPlanFlags = [],
  fallback,
  children,
}) => {
  const isEnabled = userPlanFlags.includes(flag);

  if (!isEnabled) {
    return fallback ? <>{fallback}</> : <DefaultUpgradeBanner flag={flag} />;
  }

  return <>{children}</>;
};
