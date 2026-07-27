/**
 * PNP CRM Mobile — WhatsApp Quick Business Message Templates
 * File: mobile/src/utils/whatsappTemplates.ts
 */

export interface WhatsAppTemplate {
  id: string;
  title: string;
  category: 'Visit' | 'FollowUp' | 'Quote' | 'Customer';
  icon: string;
  generateText: (data: { customerName: string; serviceType?: string; address?: string; date?: string; time?: string }) => string;
}

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'tpl-visit-confirm',
    title: 'Site Visit Confirmation',
    category: 'Visit',
    icon: '📍',
    generateText: ({ customerName, address, date, time }) =>
      `Hello ${customerName}, this is from PNP Designs. Confirming our site visit scheduled for ${date || 'soon'} at ${time || '10:00 AM'}${address ? ` at ${address}` : ''}. Please let us know if you need to adjust the timing!`,
  },
  {
    id: 'tpl-inquiry-followup',
    title: 'Inquiry Follow-Up',
    category: 'FollowUp',
    icon: '👋',
    generateText: ({ customerName, serviceType }) =>
      `Hi ${customerName}, following up regarding your ${serviceType ? serviceType.replace('_', ' ') : 'interior design'} requirement with PNP Designs. When would be a good time to connect briefly over a call?`,
  },
  {
    id: 'tpl-quote-followup',
    title: 'Quotation Follow-Up',
    category: 'Quote',
    icon: '📋',
    generateText: ({ customerName }) =>
      `Hello ${customerName}, hope you are doing well! Have you had a chance to review the design proposal and quotation we shared? We'd love to address any questions you might have.`,
  },
  {
    id: 'tpl-visit-reminder',
    title: 'Site Visit Reminder (Upcoming)',
    category: 'Visit',
    icon: '⏰',
    generateText: ({ customerName, address, time }) =>
      `Dear ${customerName}, a gentle reminder about our upcoming site visit scheduled for ${time || 'today'}${address ? ` at ${address}` : ''}. Our design executive will be on site. See you soon!`,
  },
  {
    id: 'tpl-project-update',
    title: 'Project Progress Update',
    category: 'Customer',
    icon: '🏗️',
    generateText: ({ customerName, serviceType }) =>
      `Hello ${customerName}, updating you on your ${serviceType ? serviceType.replace('_', ' ') : 'project'} with PNP Designs. Work is progressing as planned. Feel free to reach out if you have any questions!`,
  },
];
