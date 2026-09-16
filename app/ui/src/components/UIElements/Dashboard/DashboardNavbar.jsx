import { Link, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import useSettings from '../../../hooks/useSettings';
import { fetchLicenses } from '../../../util/http/licensing';
import { calculateExpiry } from '../../Licensing/helpers';

const BookIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const LicenseIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="12" r="2"/><path d="M15 10h4M15 14h4"/></svg>;
const MapIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 20l-6-2V4l6 2 6-2 6 2v14l-6-2-6 2z"/><path d="M9 6v14M15 4v14"/></svg>;
const AircraftIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 16l20-6-3 8-4-2-3 4-2-6-8 2z"/></svg>;
const AirportIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M6 21V8l6-5 6 5v13"/><path d="M10 21v-6h4v6"/></svg>;
const PersonIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7"/></svg>;
const AttachmentIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11l-8.5 8.5a4 4 0 0 1-5.7-5.7L15 5.5a2.5 2.5 0 0 1 3.5 3.5L10 17.5"/></svg>;
const StatsIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M12 20V4M20 20v-7"/></svg>;
const CurrencyIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>;
const ExportIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></svg>;
const ImportIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/></svg>;
const SettingsIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1z"/></svg>;
const Caret = () => <svg className="nav-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:13,height:13}}><path d="M9 18l6-6-6-6"/></svg>;

const items = [
  ['logbook','Logbook',BookIcon], ['licensing','Licensing',LicenseIcon], ['map','Map',MapIcon], ['aircrafts','Aircrafts',AircraftIcon],
  ['airports','Airports',AirportIcon], ['persons','Persons',PersonIcon], ['attachments','Attachments',AttachmentIcon],
  ['sep'], ['stats','Stats',StatsIcon,true], ['currency','Currency',CurrencyIcon], ['sep'], ['export','Export',ExportIcon,true], ['import','Import',ImportIcon], ['sep'], ['settings','Settings',SettingsIcon]
];

function LicensingCount() {
  const { settings } = useSettings();
  const { data: licenses = [] } = useQuery({ queryKey:['licensing'], queryFn:({signal})=>fetchLicenses({signal}), staleTime:3600000, gcTime:3600000 });
  const count = useMemo(() => {
    const cfg = settings?.licenses_expiration;
    if (!cfg) return 0;
    const warningPeriod = cfg.warning_period || 90;
    return (Array.isArray(licenses) ? licenses : []).reduce((n, license) => {
      const exp = calculateExpiry(license?.valid_until || '');
      return n + (exp && exp.diffDays < warningPeriod ? 1 : 0);
    }, 0);
  }, [licenses, settings]);
  return count > 0 ? <span className="chip warn licensing-count">{count}</span> : null;
}

export default function DashboardNavbar({ open, onNavigate }) {
  const location = useLocation();
  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      {items.map((item, i) => {
        if (item[0] === 'sep') return <div className="nav-sep" key={`s${i}`} />;
        const [segment,label,Icon,caret] = item;
        const selected = location.pathname === '/' ? segment === 'logbook' : location.pathname.startsWith(`/${segment}`);
        return (
          <Link key={segment} to={`/${segment}`} className={`nav-item${selected ? ' selected' : ''}`} onClick={onNavigate}>
            <Icon />
            {label}
            {segment === 'licensing' && <LicensingCount />}
            {caret && <Caret />}
          </Link>
        );
      })}
    </aside>
  );
}
