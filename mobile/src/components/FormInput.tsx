/**
 * PNP CRM Mobile — Form Input Components
 * File: mobile/src/components/FormInput.tsx
 */

import React from 'react';

// ── FormInput ────────────────────────────────────────────────────────────────

interface FormInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
}

export const FormInput: React.FC<FormInputProps> = ({
  label, value, onChange, placeholder = '', type = 'text', required = false, multiline = false, rows = 3,
}) => {
  const sharedStyle: React.CSSProperties = {
    width: '100%',
    padding: '13px 14px',
    backgroundColor: '#0f172a',
    border: '1.5px solid #334155',
    borderRadius: '12px',
    color: '#f1f5f9',
    fontSize: '15px',
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
    boxSizing: 'border-box',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    resize: multiline ? 'vertical' : 'none',
  };

  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.target.style.borderColor = '#4f46e5';
      e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.2)';
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.target.style.borderColor = '#334155';
      e.target.style.boxShadow = 'none';
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label} {required && <span style={{ color: '#f43f5e' }}>*</span>}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          style={{ ...sharedStyle, lineHeight: '1.5' }}
          {...focusHandlers}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={sharedStyle}
          {...focusHandlers}
        />
      )}
    </div>
  );
};

// ── FormSelect ───────────────────────────────────────────────────────────────

interface FormSelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
  required?: boolean;
}

export const FormSelect: React.FC<FormSelectProps> = ({ label, value, onChange, options, required = false }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label} {required && <span style={{ color: '#f43f5e' }}>*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '13px 14px',
          backgroundColor: '#0f172a',
          border: '1.5px solid #334155',
          borderRadius: '12px',
          color: value ? '#f1f5f9' : '#64748b',
          fontSize: '15px',
          outline: 'none',
          fontFamily: "'Inter', sans-serif",
          cursor: 'pointer',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 14px center',
          paddingRight: '40px',
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
};

// ── ActionButton ─────────────────────────────────────────────────────────────

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  color?: 'indigo' | 'emerald' | 'rose' | 'slate' | 'amber';
  icon?: React.ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
  outline?: boolean;
}

const COLOR_MAP = {
  indigo:  { bg: '#4f46e5', shadow: 'rgba(79,70,229,0.35)',  text: '#fff' },
  emerald: { bg: '#10b981', shadow: 'rgba(16,185,129,0.35)', text: '#fff' },
  rose:    { bg: '#f43f5e', shadow: 'rgba(244,63,94,0.35)',  text: '#fff' },
  slate:   { bg: '#334155', shadow: 'rgba(51,65,85,0.35)',   text: '#e2e8f0' },
  amber:   { bg: '#f59e0b', shadow: 'rgba(245,158,11,0.35)', text: '#fff' },
};

export const ActionButton: React.FC<ActionButtonProps> = ({
  label, onClick, color = 'indigo', icon, disabled = false, fullWidth = true, outline = false,
}) => {
  const cfg = COLOR_MAP[color];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: fullWidth ? '100%' : 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '15px 20px',
        backgroundColor: outline ? 'transparent' : cfg.bg,
        border: outline ? `2px solid ${cfg.bg}` : 'none',
        borderRadius: '14px',
        color: outline ? cfg.bg : cfg.text,
        fontSize: '15px',
        fontWeight: '700',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: outline ? 'none' : `0 4px 16px ${cfg.shadow}`,
        opacity: disabled ? 0.5 : 1,
        fontFamily: "'Inter', sans-serif",
        transition: 'transform 0.1s ease',
        WebkitTapHighlightColor: 'transparent',
        letterSpacing: '0.01em',
      }}
      onPointerDown={(e) => { if (!disabled) (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
      onPointerUp={(e) => { if (!disabled) (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
    >
      {icon && icon}
      {label}
    </button>
  );
};
