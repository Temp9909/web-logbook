import { useState } from 'react';
import DashboardToolbar from '../components/UIElements/Dashboard/DashboardToolbar';
import DashboardNavbar from '../components/UIElements/Dashboard/DashboardNavbar';
import DashboardPageContent from '../components/UIElements/Dashboard/DashboardPageContent';

export default function Root() {
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window === 'undefined' || window.matchMedia('(min-width: 801px)').matches);
  const closeAfterNavigation = () => {
    if (window.matchMedia('(max-width: 800px)').matches) setSidebarOpen(false);
  };
  return (
    <div className="app">
      <DashboardNavbar open={sidebarOpen} onNavigate={closeAfterNavigation} />
      {sidebarOpen && <div className="apple-mobile-overlay" onClick={() => setSidebarOpen(false)} />}
      <div className="main">
        <DashboardToolbar menuOpen={sidebarOpen} onMenu={() => setSidebarOpen(v => !v)} />
        <DashboardPageContent />
      </div>
    </div>
  );
}
