/**
 * PNP CRM Mobile — Customers Screen (Full Rebuild)
 * File: mobile/src/pages/Customers.tsx
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Search, Building2 } from 'lucide-react';
import { MobileLayout } from '../components/MobileLayout';
import { Header } from '../components/Header';
import { FilterChips } from '../components/FilterChips';
import { CustomerCard } from '../components/CustomerCard';
import { useAppStore } from '../store/appStore';
import { getAllCustomers, getAllLeads, saveCustomerFromLead, type LocalCustomer } from '../db/sqlite';

const FILTER_OPTIONS = [
  { label: 'All', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'On Hold', value: 'ON_HOLD' },
];

export const Customers: React.FC = () => {
  const { navigate, setSelectedCustomerId, notificationCount } = useAppStore();
  const [customers, setCustomers] = useState<LocalCustomer[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      // Primary: load from customers cache
      let data = await getAllCustomers();

      // Fallback: derive from WON_ORDER leads if cache is empty
      if (data.length === 0) {
        const leads = await getAllLeads();
        const wonLeads = leads.filter((l) => l.status === 'WON_ORDER');
        for (const lead of wonLeads) {
          await saveCustomerFromLead(lead);
        }
        data = await getAllCustomers();
      }

      setCustomers(data);
    } catch {
      // Browser mode / SQLite unavailable — show empty state, never fake data
      setCustomers([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = customers.filter((c) => {
    const matchesFilter = filter === 'ALL' || c.projectStatus === filter;
    const q = search.toLowerCase();
    const matchesSearch = !q || c.customerName.toLowerCase().includes(q) || c.contactNumber.includes(q);
    return matchesFilter && matchesSearch;
  });

  const openCustomer = (id: string) => {
    setSelectedCustomerId(id);
    navigate('customer-detail');
  };

  return (
    <MobileLayout>
      <Header notificationCount={notificationCount} />

      <div style={{ padding: '8px 16px 100px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h1 style={{ color: '#ffffff', fontSize: '22px', fontWeight: '700', margin: '0 0 4px', letterSpacing: '-0.3px' }}>Customers</h1>
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>{customers.length} total customers</p>
        </div>

        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone…"
            style={{ width: '100%', padding: '12px 14px 12px 40px', backgroundColor: '#1e293b', border: '1.5px solid #334155', borderRadius: '12px', color: '#f1f5f9', fontSize: '14px', outline: 'none', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <FilterChips options={FILTER_OPTIONS} selected={filter} onChange={setFilter} />
        </div>

        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '60px', gap: '16px' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: '#1e293b', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={28} color="#0ea5e9" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#f1f5f9', fontSize: '16px', fontWeight: '600', margin: '0 0 6px' }}>No customers yet</p>
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Mark a lead as Won in Lead Detail to add customers</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map((c) => (
              <CustomerCard key={c.mobileId} customer={c} onTap={() => openCustomer(c.mobileId)} />
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};
