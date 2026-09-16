import { Link, useLocation } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import useSettings from '../../../hooks/useSettings';
import { fetchLicenses } from '../../../util/http/licensing';
import { calculateExpiry } from '../../Licensing/helpers';

const BookIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const LicenseIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="12" r="2"/><path d="M15 10h4M15 14h4"/></svg>;
const MapIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 20l-6-2V4l6 2 6-2 6 2v14l-6-2-6 2z"/><path d="M9 6v14M15 4v14"/></svg>;
const AircraftIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 16l20-6-3 8-4-2-3 4-2-6-8 2z"/></svg>;
const PersonIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7"/></svg>;
const AttachmentIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11l-8.5 8.5a4 4 0 0 1-5.7-5.7L15 5.5a2.5 2.5 0 0 1 3.5 3.5L10 17.5"/></svg>;
const StatsIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M12 20V4M20 20v-7"/></svg>;
const ExportIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></svg>;
const ImportIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/></svg>;
const SettingsIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1z"/></svg>;
const Caret = ({ open = false }) => <span className={`nav-caret${open ? ' open' : ''}`}>{open ? '⌄' : '›'}</span>;

function LicensingCount() {
  const { settings } = useSettings();
  const { data: licenses = [] } = useQuery({ queryKey:['licensing'], queryFn:({signal})=>fetchLicenses({signal}), staleTime:3600000, gcTime:3600000 });
  const count = useMemo(() => {
    const warningPeriod = settings?.licenses_expiration?.warning_period || 90;
    return (Array.isArray(licenses) ? licenses : []).reduce((n, license) => {
      const exp = calculateExpiry(license?.valid_until || '');
      return n + (exp && exp.diffDays < warningPeriod ? 1 : 0);
    }, 0);
  }, [licenses, settings]);
  return count > 0 ? <span className="chip warn licensing-count">{count}</span> : null;
}

const MainLink = ({ to, segment, label, Icon, count, onNavigate, location }) => {
  const selected = location.pathname === '/' ? segment === 'logbook' : location.pathname.startsWith(`/${segment}`);
  return <Link to={to} className={`nav-item${selected ? ' selected' : ''}`} onClick={onNavigate}><Icon />{label}{count}</Link>;
};

const MainToggle = ({ segment, label, Icon, open, onToggle, location }) => {
  const selected = location.pathname.startsWith(`/${segment}`);
  return (
    <button
      type="button"
      className={`nav-item${selected ? ' selected' : ''}`}
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={`${segment}-submenu`}
    >
      <Icon />{label}<Caret open={open}/>
    </button>
  );
};

export default function DashboardNavbar({ open, onNavigate }) {
  const location = useLocation();
  const statSelected = location.pathname.startsWith('/stats');
  const exportSelected = location.pathname.startsWith('/export');
  const [statsOpen, setStatsOpen] = useState(statSelected);
  const [exportOpen, setExportOpen] = useState(exportSelected);
  const subClass = (path) => location.pathname === path ? 'selected' : '';

  const toggleStats = () => setStatsOpen((current) => !current);
  const toggleExport = () => setExportOpen((current) => !current);

  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      <MainLink to="/logbook" segment="logbook" label="Logbook" Icon={BookIcon} onNavigate={onNavigate} location={location}/>
      <MainLink to="/licensing" segment="licensing" label="Licensing" Icon={LicenseIcon} count={<LicensingCount/>} onNavigate={onNavigate} location={location}/>
      <MainLink to="/map" segment="map" label="Map" Icon={MapIcon} onNavigate={onNavigate} location={location}/>
      <MainLink to="/aircrafts" segment="aircrafts" label="Aircrafts" Icon={AircraftIcon} onNavigate={onNavigate} location={location}/>
      <MainLink to="/persons" segment="persons" label="Persons" Icon={PersonIcon} onNavigate={onNavigate} location={location}/>
      <MainLink to="/attachments" segment="attachments" label="Attachments" Icon={AttachmentIcon} onNavigate={onNavigate} location={location}/>
      <div className="nav-sep"/>
      <MainToggle segment="stats" label="Stats" Icon={StatsIcon} open={statsOpen} onToggle={toggleStats} location={location}/>
      {statsOpen ? <div id="stats-submenu" className="nav-group-sub"><Link className={subClass('/stats/dashboard')} to="/stats/dashboard" onClick={onNavigate}>Dashboard</Link><Link className={subClass('/stats/by-year')} to="/stats/by-year" onClick={onNavigate}>By year</Link><Link className={subClass('/stats/by-type')} to="/stats/by-type" onClick={onNavigate}>By type</Link><Link className={subClass('/stats/by-category')} to="/stats/by-category" onClick={onNavigate}>By category</Link></div> : null}
      <div className="nav-sep"/>
      <MainToggle segment="export" label="Export" Icon={ExportIcon} open={exportOpen} onToggle={toggleExport} location={location}/>
      {exportOpen ? <div id="export-submenu" className="nav-group-sub"><Link className={subClass('/export/a4')} to="/export/a4" onClick={onNavigate}>A4</Link><Link className={subClass('/export/a5')} to="/export/a5" onClick={onNavigate}>A5</Link></div> : null}
      <MainLink to="/import" segment="import" label="Import" Icon={ImportIcon} onNavigate={onNavigate} location={location}/>
      <div className="nav-sep"/>
      <MainLink to="/settings" segment="settings" label="Settings" Icon={SettingsIcon} onNavigate={onNavigate} location={location}/>
    </aside>
  );
}
