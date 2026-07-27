/**
 * PNP CRM Mobile — Toast Notification Component
 * File: mobile/src/components/Toast.tsx
 *
 * Shows success/error messages after sync operations.
 */

import React from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(16px + env(safe-area-inset-top, 0px))',
        left: '16px',
        right: '16px',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            style={{
              backgroundColor: isSuccess ? '#064e3b' : isError ? '#7f1d1d' : '#1e293b',
              border: `1px solid ${isSuccess ? '#10b981' : isError ? '#ef4444' : '#4f46e5'}`,
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              animation: 'slideDown 0.25s ease',
            }}
          >
            {isSuccess && <CheckCircle size={20} color="#10b981" />}
            {isError && <XCircle size={20} color="#ef4444" />}
            {!isSuccess && !isError && <Info size={20} color="#4f46e5" />}

            <span
              style={{
                flex: 1,
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '500',
                lineHeight: '1.4',
              }}
            >
              {toast.message}
            </span>

            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                flexShrink: 0,
              }}
            >
              <X size={16} color="#94a3b8" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
