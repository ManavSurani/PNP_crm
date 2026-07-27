/**
 * PNP CRM Mobile — Mobile Layout Shell
 * File: mobile/src/components/MobileLayout.tsx
 *
 * The master wrapper that holds the bottom nav and content area for all pages.
 */

import React from 'react';
import { BottomNav } from './BottomNav';
import { ToastContainer } from './Toast';
import { NetworkBanner } from './NetworkBanner';

interface MobileLayoutProps {
  children: React.ReactNode;
  hideBottomNav?: boolean;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children, hideBottomNav }) => {
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        position: 'relative',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Network banner for offline mode */}
      <NetworkBanner />

      {/* Toast notifications (global, z-index: 999) */}
      <ToastContainer />

      {/* Main scrollable content area */}
      <div
        style={{
          width: '100%',
          minHeight: '100vh',
          paddingBottom: hideBottomNav ? '0px' : '80px', // leave space for bottom nav only when shown
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </div>

      {/* Fixed bottom navigation */}
      {!hideBottomNav && <BottomNav />}
    </div>
  );
};
