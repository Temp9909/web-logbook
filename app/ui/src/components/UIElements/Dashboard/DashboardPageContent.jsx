import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

export default function DashboardPageContent() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  const section = parts[0] || 'logbook';
  const isMainLogbook = section === 'logbook' && parts.length <= 1;
  const isStats = section === 'stats';
  const usesLegacyMuiLayout = !isMainLogbook && !isStats;

  useEffect(() => {
    document.body.classList.toggle('apple-legacy-page', usesLegacyMuiLayout);
    document.body.dataset.applePage = section;
    return () => {
      document.body.classList.remove('apple-legacy-page');
      delete document.body.dataset.applePage;
    };
  }, [section, usesLegacyMuiLayout]);

  return (
    <div className={`apple-main-content pages apple-route-${section}${usesLegacyMuiLayout ? ' apple-legacy-theme' : ''}`}>
      <div className="apple-page-generic"><Outlet /></div>
    </div>
  );
}
