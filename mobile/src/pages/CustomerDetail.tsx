/**
 * PNP CRM Mobile — Customer Detail Screen
 * File: mobile/src/pages/CustomerDetail.tsx
 */

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Phone, MessageCircle, Tag, MapPin, DollarSign, Calendar, ExternalLink } from 'lucide-react';
import { MobileLayout } from '../components/MobileLayout';
import { ActionButton } from '../components/FormInput';
import { WhatsAppModal } from '../components/WhatsAppModal';
import { useAppStore } from '../store/appStore';
import { getAllCustomers, updateCustomerProjectStatus, getAllFollowUps, getAllVisits, type LocalCustomer, type LocalFollowUp, type LocalVisit } from '../db/sqlite';

const PROJECT_STATUS = [
  { label: 'Active Project', value: 'ACTIVE', color: '#10b981' },
  { label: 'Completed', value: 'COMPLETED', color: '#4f46e5' },
  { label: 'On Hold', value: 'ON_HOLD', color: '#f59e0b' },
];

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase() ?? '').join('');

const SERVICE_LABELS: Record<string, string> = {
  'Interior Design': 'Interior Design',
  '2BHK Interior': '2BHK Interior',
  '3BHK Interior': '3BHK Interior',
  '4BHK Interior': '4BHK Interior',
  'Raw house': 'Raw house',
  'Office': 'Office',
  'Other': 'Other',
};

export const CustomerDetail: React.FC = () => {
  const { selectedCustomerId, goBack, addToast } = useAppStore();
  const [customer, setCustomer] = useState<LocalCustomer | null>(null);
  const [followUps, setFollowUps] = useState<LocalFollowUp[]>([]);
  const [visits, setVisits] = useState<LocalVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);

  // Get tunnel URL from settings (localStorage)
  const tunnelUrl = localStorage.getItem('pnp_tunnel_url') ?? 'https://your-tunnel.trycloudflare.com';

  useEffect(() => {
    const load = async () => {
      try {
        const [customers, fus, allVisits] = await Promise.all([
          getAllCustomers(), getAllFollowUps(), getAllVisits(),
        ]);
        const found = customers.find((c) => c.mobileId === selectedCustomerId);
        setCustomer(found ?? null);
        if (found) {
          setFollowUps(fus.filter((f) => f.leadMobileId === found.mobileId));
          setVisits(allVisits.filter((v) => v.leadMobileId === found.mobileId));
        }
      } catch {
        setCustomer(null);
      } finally { setLoading(false); }
    };
    load();
  }, [selectedCustomerId]);

  const handleStatusChange = async (status: string) => {
    if (!customer) return;
    try {
      await updateCustomerProjectStatus(customer.mobileId, status);
      setCustomer((prev) => prev ? { ...prev, projectStatus: status } : null);
      addToast(`Project status updated to ${status.replace('_', ' ')}.`, 'success');
    } catch {
      addToast('Failed to update status.', 'error');
    }
  };

  if (loading || !customer) {
    return (
      <MobileLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ width: '24px', height: '24px', border: '2.5px solid #0ea5e9', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </MobileLayout>
    );
  }

  const whatsappUrl = `https://wa.me/91${customer.contactNumber}`;
  const crmUrl = `${tunnelUrl}/leads`;
  const psCfg = PROJECT_STATUS.find((p) => p.value === customer.projectStatus) ?? PROJECT_STATUS[0];

  return (
    <MobileLayout hideBottomNav>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))', backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <ArrowLeft size={22} color="#94a3b8" />
        </button>
        <h1 style={{ color: '#ffffff', fontSize: '18px', fontWeight: '700', margin: 0 }}>Customer</h1>
      </div>

      <div style={{ padding: '16px 16px 120px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Profile */}
        <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div style={{ width: '56px', height: '56px', backgroundColor: 'rgba(14,165,233,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(14,165,233,0.3)', flexShrink: 0 }}>
              <span style={{ color: '#38bdf8', fontSize: '20px', fontWeight: '800' }}>{getInitials(customer.customerName)}</span>
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: '700', margin: '0 0 4px' }}>{customer.customerName}</h2>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>{customer.contactNumber}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a href={`tel:${customer.contactNumber}`} style={{ textDecoration: 'none' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#1d4ed8', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={18} color="#fff" />
                </div>
              </a>
              <button onClick={() => setIsWaModalOpen(true)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#15803d', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageCircle size={18} color="#fff" />
                </div>
              </button>
            </div>
          </div>
          {/* Info chips */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <InfoChip icon={<Tag size={12} color="#818cf8" />} label={SERVICE_LABELS[customer.serviceType] ?? customer.serviceType} />
            {customer.siteLocation && <InfoChip icon={<MapPin size={12} color="#818cf8" />} label={customer.siteLocation} />}
            {customer.budgetRange && <InfoChip icon={<DollarSign size={12} color="#818cf8" />} label={customer.budgetRange} />}
            {customer.wonAt && <InfoChip icon={<Calendar size={12} color="#818cf8" />} label={`Won ${new Date(customer.wonAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`} />}
          </div>
        </div>

        {/* Project Status */}
        <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <p style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Project Status</p>
            <span style={{ color: psCfg.color, fontSize: '13px', fontWeight: '700' }}>{psCfg.label}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {PROJECT_STATUS.filter((p) => p.value !== customer.projectStatus).map((p) => (
              <button key={p.value} onClick={() => handleStatusChange(p.value)}
                style={{ flex: 1, padding: '10px 8px', backgroundColor: 'transparent', border: `1.5px solid ${p.color}`, borderRadius: '10px', color: p.color, fontSize: '11px', fontWeight: '700', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                → {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Follow-up history */}
        {followUps.length > 0 && (
          <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '18px' }}>
            <p style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>Follow-up History ({followUps.length})</p>
            {followUps.slice(0, 3).map((f) => (
              <div key={f.mobileId} style={{ borderBottom: '1px solid #0f172a', paddingBottom: '10px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: '600' }}>{f.outcome.replace('_', ' ')}</span>
                  <span style={{ color: '#64748b', fontSize: '11px' }}>{new Date(f.scheduledDate).toLocaleDateString('en-IN')}</span>
                </div>
                {f.noteGiven && <p style={{ color: '#94a3b8', fontSize: '12px', margin: '4px 0 0', lineHeight: '1.4' }}>{f.noteGiven}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Visit history */}
        {visits.length > 0 && (
          <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '18px' }}>
            <p style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>Site Visits ({visits.length})</p>
            {visits.map((v) => (
              <div key={v.mobileId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#f1f5f9', fontSize: '13px' }}>{v.address}</span>
                <span style={{ color: '#64748b', fontSize: '11px' }}>{new Date(v.date).toLocaleDateString('en-IN')}</span>
              </div>
            ))}
          </div>
        )}

        {/* CRM Link */}
        <a href={crmUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <ActionButton label="View in Main CRM" onClick={() => {}} color="slate" icon={<ExternalLink size={16} color="#e2e8f0" />} outline />
        </a>

        {/* WhatsApp Modal */}
        <WhatsAppModal
          isOpen={isWaModalOpen}
          onClose={() => setIsWaModalOpen(false)}
          customerName={customer.customerName}
          contactNumber={customer.contactNumber}
          serviceType={customer.serviceType}
          address={customer.siteLocation}
        />
      </div>
    </MobileLayout>
  );
};

const InfoChip: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(79,70,229,0.1)', padding: '4px 10px', borderRadius: '8px' }}>
    {icon}
    <span style={{ color: '#a5b4fc', fontSize: '12px', fontWeight: '500' }}>{label}</span>
  </div>
);
