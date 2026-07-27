/**
 * PNP CRM Mobile — FilterChips Component
 * File: mobile/src/components/FilterChips.tsx
 */

import React from 'react';

interface FilterChipsProps {
  options: { label: string; value: string }[];
  selected: string;
  onChange: (value: string) => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({ options, selected, onChange }) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '4px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none' as React.CSSProperties['msOverflowStyle'],
      }}
    >
      {options.map((opt) => {
        const isActive = selected === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              flexShrink: 0,
              padding: '7px 16px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: isActive ? '600' : '500',
              cursor: 'pointer',
              border: isActive ? '1.5px solid #4f46e5' : '1.5px solid #334155',
              backgroundColor: isActive ? '#4f46e5' : 'transparent',
              color: isActive ? '#ffffff' : '#94a3b8',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
