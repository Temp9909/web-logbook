import { useState } from 'react';
import DashboardToolbar from '../components/UIElements/Dashboard/DashboardToolbar';
import DashboardNavbar from '../components/UIElements/Dashboard/DashboardNavbar';
import DashboardPageContent from '../components/UIElements/Dashboard/DashboardPageContent';

export default function Root() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="app">
      <DashboardNavbar open={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      {mobileOpen && <div className="apple-mobile-overlay" onClick={() => setMobileOpen(false)} />}
      <div className="main">
        <DashboardToolbar onMenu={() => setMobileOpen(v => !v)} />
        <DashboardPageContent />
      </div>
    </div>
  );
}
