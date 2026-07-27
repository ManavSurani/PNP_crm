/**
 * PNP CRM Mobile — Bottom Navigation Bar
 * File: mobile/src/components/BottomNav.tsx
 */

import React from 'react';
import { Home, Users, Phone, MapPin, Briefcase, LucideIcon } from 'lucide-react';
import { useAppStore, ActiveTab } from '../store/appStore';

interface NavItem {
  id: ActiveTab;
  label: string;
  Icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home',      label: 'Home',       Icon: Home },
  { id: 'leads',     label: 'Leads',      Icon: Users },
  { id: 'followups', label: 'Follow-ups', Icon: Phone },
  { id: 'visits',    label: 'Visits',     Icon: MapPin },
  { id: 'customers', label: 'Customers',  Icon: Briefcase },
];

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1e293b',
        borderTop: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '8px 0',
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
        zIndex: 100,
      }}
    >
      {NAV_ITEMS.map(({ id, label, Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 14px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '8px',
              transition: 'transform 0.1s ease',
              WebkitTapHighlightColor: 'transparent',
            }}
            onPointerDown={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(0.9)';
            }}
            onPointerUp={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            }}
          >
            <Icon
              size={22}
              color={isActive ? '#4f46e5' : '#64748b'}
              strokeWidth={isActive ? 2.2 : 1.8}
            />
            <span
              style={{
                fontSize: '10px',
                fontWeight: isActive ? '600' : '400',
                color: isActive ? '#4f46e5' : '#64748b',
                letterSpacing: '0.02em',
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
