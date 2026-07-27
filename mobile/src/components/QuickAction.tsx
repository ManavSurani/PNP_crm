/**
 * PNP CRM Mobile — QuickAction Component
 * File: mobile/src/components/QuickAction.tsx
 *
 * The 3 solid vibrant action buttons on the Dashboard.
 * Each is a full-color rectangle with an icon and label.
 */

import React from 'react';

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  backgroundColor: string;
  shadowColor: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export const QuickAction: React.FC<QuickActionProps> = ({
  icon,
  label,
  backgroundColor,
  shadowColor,
  onClick,
  disabled = false,
  loading = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '18px 8px',
        backgroundColor: disabled ? '#334155' : backgroundColor,
        border: 'none',
        borderRadius: '16px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : `0 6px 20px ${shadowColor}`,
        transition: 'transform 0.12s ease, box-shadow 0.12s ease',
        WebkitTapHighlightColor: 'transparent',
        minWidth: 0,
        opacity: disabled ? 0.6 : 1,
      }}
      onPointerDown={(e) => {
        if (!disabled && !loading) {
          (e.currentTarget as HTMLElement).style.transform = 'scale(0.94)';
          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        }
      }}
      onPointerUp={(e) => {
        if (!disabled && !loading) {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${shadowColor}`;
        }
      }}
    >
      {/* Icon area */}
      <div
        style={{
          width: '44px',
          height: '44px',
          backgroundColor: 'rgba(255,255,255,0.18)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {loading ? (
          <div
            style={{
              width: '20px',
              height: '20px',
              border: '2.5px solid rgba(255,255,255,0.4)',
              borderTopColor: '#ffffff',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }}
          />
        ) : (
          icon
        )}
      </div>

      {/* Label */}
      <span
        style={{
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: '600',
          textAlign: 'center',
          letterSpacing: '0.01em',
          lineHeight: '1.2',
        }}
      >
        {loading ? 'Syncing…' : label}
      </span>
    </button>
  );
};
