/**
 * PNP CRM Mobile — WhatsApp Quick Template Modal Component
 * File: mobile/src/components/WhatsAppModal.tsx
 */

import React, { useState, useEffect } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';
import { WHATSAPP_TEMPLATES, type WhatsAppTemplate } from '../utils/whatsappTemplates';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  contactNumber: string;
  serviceType?: string;
  address?: string;
  date?: string;
  time?: string;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  customerName,
  contactNumber,
  serviceType,
  address,
  date,
  time,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate>(WHATSAPP_TEMPLATES[0]);
  const [customMessage, setCustomMessage] = useState('');

  useEffect(() => {
    if (selectedTemplate) {
      const generated = selectedTemplate.generateText({ customerName, serviceType, address, date, time });
      setCustomMessage(generated);
    }
  }, [selectedTemplate, customerName, serviceType, address, date, time]);

  if (!isOpen) return null;

  const handleSend = () => {
    const cleanNumber = contactNumber.replace(/\D/g, '');
    const numWithCountry = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;
    const url = `https://wa.me/${numWithCountry}?text=${encodeURIComponent(customMessage)}`;
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          backgroundColor: '#1e293b',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          padding: '20px 20px 32px',
          border: '1px solid #334155',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', backgroundColor: 'rgba(21, 128, 61, 0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={20} color="#22c55e" />
            </div>
            <div>
              <h3 style={{ color: '#ffffff', fontSize: '17px', fontWeight: '700', margin: 0 }}>WhatsApp Template</h3>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>Send quick message to {customerName}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}>
            <X size={20} color="#94a3b8" />
          </button>
        </div>

        {/* Template Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {WHATSAPP_TEMPLATES.map((tpl) => {
            const isSelected = selectedTemplate.id === tpl.id;
            return (
              <button
                key={tpl.id}
                onClick={() => setSelectedTemplate(tpl)}
                style={{
                  flexShrink: 0,
                  padding: '8px 12px',
                  borderRadius: '12px',
                  backgroundColor: isSelected ? 'rgba(34, 197, 94, 0.2)' : '#0f172a',
                  border: isSelected ? '1.5px solid #22c55e' : '1px solid #334155',
                  color: isSelected ? '#4ade80' : '#94a3b8',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{tpl.icon}</span>
                <span>{tpl.title}</span>
              </button>
            );
          })}
        </div>

        {/* Message Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Message Preview (Editable)
          </label>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={5}
            style={{
              width: '100%',
              padding: '12px 14px',
              backgroundColor: '#0f172a',
              border: '1.5px solid #334155',
              borderRadius: '12px',
              color: '#f1f5f9',
              fontSize: '14px',
              lineHeight: '1.5',
              outline: 'none',
              fontFamily: "'Inter', sans-serif",
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Action Button */}
        <button
          onClick={handleSend}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: '#16a34a',
            border: 'none',
            borderRadius: '14px',
            color: '#ffffff',
            fontSize: '15px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(22, 163, 74, 0.4)',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <Send size={18} color="#fff" />
          Open in WhatsApp
        </button>
      </div>
    </div>
  );
};
