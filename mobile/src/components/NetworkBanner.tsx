/**
 * PNP CRM Mobile — Network Status Banner Component
 * File: mobile/src/components/NetworkBanner.tsx
 */

import React from 'react';
import { WifiOff } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export const NetworkBanner: React.FC = () => {
  const { isOnline } = useAppStore();

  if (isOnline) return null;

  return (
    <div
      style={{
        width: '100%',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        boxSizing: 'border-box',
      }}
    >
      <WifiOff size={14} color="#f59e0b" />
      <span style={{ color: '#fbbf24', fontSize: '12px', fontWeight: '600' }}>
        Offline Mode — Changes saved locally & will sync when connected
      </span>
    </div>
  );
};
