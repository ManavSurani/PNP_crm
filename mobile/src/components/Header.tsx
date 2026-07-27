/**
 * PNP CRM Mobile — Header Component
 * File: mobile/src/components/Header.tsx
 */

import React from 'react';
import { Bell } from 'lucide-react';
import { useAppStore } from '../store/appStore';

interface HeaderProps {
  notificationCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ notificationCount: propCount }) => {
  const { navigate, notificationCount: storeCount } = useAppStore();
  const count = propCount ?? storeCount;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
        backgroundColor: '#0f172a',
      }}
    >
      {/* PNP Logo + Text */}
      <button
        onClick={() => navigate('settings')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* Logo Square */}
        <div
          style={{
            width: '38px',
            height: '38px',
            backgroundColor: '#4f46e5',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(79,70,229,0.4)',
          }}
        >
          <span
            style={{
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '800',
              letterSpacing: '0.5px',
            }}
          >
            PNP
          </span>
        </div>
        {/* App Name */}
        <span
          style={{
            color: '#ffffff',
            fontSize: '18px',
            fontWeight: '700',
            letterSpacing: '-0.3px',
          }}
        >
          PNP CRM
        </span>
      </button>

      {/* Notification Bell */}
      <button
        onClick={() => navigate('notifications')}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <Bell
          size={24}
          color="#94a3b8"
          strokeWidth={1.8}
        />
        {count > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '-1px',
              right: '-1px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontSize: '9px',
              fontWeight: '700',
              width: '17px',
              height: '17px',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #0f172a',
            }}
          >
            {count > 9 ? '9+' : count}
          </div>
        )}
      </button>
    </div>
  );
};

