/**
 * PNP CRM Mobile — Root App Component
 * File: mobile/src/App.tsx
 *
 * Bootstraps the database and renders the active screen based on navigation state.
 */

import React, { useEffect, useState } from 'react';
import { useAppStore } from './store/appStore';
import { initDB } from './db/sqlite';
import { initNetworkListener } from './utils/networkListener';
import { requestNotificationPermissions } from './utils/notifications';

// ── Pages ──
import { Dashboard }      from './pages/Dashboard';
import { LeadPipeline }   from './pages/LeadPipeline';
import { AddLead }        from './pages/AddLead';
import { LeadDetail }     from './pages/LeadDetail';
import { AddFollowUp }    from './pages/AddFollowUp';
import { FollowUps }      from './pages/FollowUps';
import { Visits }         from './pages/Visits';
import { AddVisit }       from './pages/AddVisit';
import { VisitDetail }    from './pages/VisitDetail';
import { Customers }      from './pages/Customers';
import { CustomerDetail } from './pages/CustomerDetail';
import { SyncHub }        from './pages/SyncHub';
import { Settings }       from './pages/Settings';
import { Notifications }  from './pages/Notifications';

const App: React.FC = () => {
  const { currentScreen } = useAppStore();
  const [dbReady, setDbReady] = useState(false);

  // Initialize SQLite DB, network listener, and notifications on startup
  useEffect(() => {
    initDB()
      .then(() => setDbReady(true))
      .catch(() => setDbReady(true));

    const cleanupNetwork = initNetworkListener();
    requestNotificationPermissions();

    return () => {
      cleanupNetwork.then((cleanup) => cleanup?.());
    };
  }, []);

  if (!dbReady) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center', gap: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '52px', height: '52px', backgroundColor: '#4f46e5', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(79,70,229,0.5)' }}>
            <span style={{ color: '#fff', fontSize: '16px', fontWeight: '800' }}>PNP</span>
          </div>
          <div style={{ width: '24px', height: '24px', border: '2.5px solid rgba(79,70,229,0.3)', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ── Screen Router ──
  return (
    <>
      {currentScreen === 'dashboard'       && <Dashboard />}
      {currentScreen === 'leads'           && <LeadPipeline />}
      {currentScreen === 'add-lead'        && <AddLead />}
      {currentScreen === 'lead-detail'     && <LeadDetail />}
      {currentScreen === 'add-followup'    && <AddFollowUp />}
      {currentScreen === 'followups'       && <FollowUps />}
      {currentScreen === 'visits'          && <Visits />}
      {currentScreen === 'add-visit'       && <AddVisit />}
      {currentScreen === 'visit-detail'    && <VisitDetail />}
      {currentScreen === 'customers'       && <Customers />}
      {currentScreen === 'customer-detail'  && <CustomerDetail />}
      {currentScreen === 'sync-hub'        && <SyncHub />}
      {currentScreen === 'settings'        && <Settings />}
      {currentScreen === 'notifications'   && <Notifications />}
    </>
  );
};

export default App;
