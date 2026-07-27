/**
 * PNP CRM Mobile — StatCard Component
 * File: mobile/src/components/StatCard.tsx
 *
 * The 4 dark cards in the 2x2 grid on the dashboard.
 * Each shows: colored icon, huge bold number, small label.
 */

import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  iconBgColor: string;
  number: number | string;
  label: string;
}

export const StatCard: React.FC<StatCardProps> = ({ icon, iconBgColor, number, label }) => {
  return (
    <div
      style={{
        backgroundColor: '#1e293b',
        borderRadius: '16px',
        padding: '18px 16px',
        border: '1px solid rgba(79,70,229,0.2)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25), 0 0 0 1px rgba(79,70,229,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '40px',
          height: '40px',
          backgroundColor: iconBgColor,
          borderRadius: '11px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      {/* Number — very large and bold */}
      <div
        style={{
          fontSize: '38px',
          fontWeight: '800',
          color: '#ffffff',
          lineHeight: '1',
          letterSpacing: '-1px',
        }}
      >
        {number}
      </div>

      {/* Label */}
      <div
        style={{
          fontSize: '12px',
          fontWeight: '500',
          color: '#94a3b8',
          letterSpacing: '0.01em',
        }}
      >
        {label}
      </div>
    </div>
  );
};
