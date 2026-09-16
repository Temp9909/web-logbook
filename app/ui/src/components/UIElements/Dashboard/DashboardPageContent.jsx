import { Outlet, useLocation } from 'react-router-dom';

export default function DashboardPageContent() {
  const location = useLocation();
  const section = location.pathname.split('/').filter(Boolean)[0] || 'logbook';
  return (
    <div className={`apple-main-content pages apple-route-${section}`}>
      <div className="apple-page-generic"><Outlet /></div>
    </div>
  );
}
