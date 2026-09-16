import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import LinearProgress from '@mui/material/LinearProgress';
import { fetchLogbookData } from '../../util/http/logbook';
import { useErrorNotification } from '../../hooks/useAppNotifications';

const toMinutes = (value) => {
  if (!value || typeof value !== 'string') return 0;
  const [h='0',m='0'] = value.split(':');
  return (Number.parseInt(h,10)||0)*60 + (Number.parseInt(m,10)||0);
};
const formatMinutes = (minutes) => `${Math.floor((minutes||0)/60).toLocaleString()}:${String((minutes||0)%60).padStart(2,'0')}`;
const dash = (v) => (v === undefined || v === null || v === '' || v === 0 ? '—' : v);
const yearOf = (date) => {
  if (!date) return '';
  const m = String(date).match(/(\d{4})/g);
  return m ? m[m.length-1] : '';
};
const shortDate = (date) => {
  if (!date) return '—';
  const s = String(date);
  const m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-]\d{4}/);
  if (m) return `${m[1].padStart(2,'0')}/${m[2].padStart(2,'0')}`;
  const iso = s.match(/^\d{4}-(\d{2})-(\d{2})/);
  if (iso) return `${iso[2]}/${iso[1]}`;
  return s;
};
const humanDate = (date) => {
  if (!date) return '';
  const s = String(date);
  let d;
  let m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (m) d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  else {
    m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
    : s;
};

const rowTime = (r, key) => r?.time?.[key] || '';
const rowLanding = (r, key) => r?.landings?.[key] || 0;

function SummaryTile({ title, value, delta, total }) {
  return <div className="card tile"><div className="cap">{title}</div><div className="val mono">{value}</div><div className="delta">+{delta}{total ? ' this year' : ''}</div></div>;
}

function EasaTable({ rows, onOpen }) {
  return (
    <div className="card table-wrap">
      <table className="easa apple-logbook-table">
        <thead>
          <tr className="grp">
            <th rowSpan="2">Date</th>
            <th colSpan="2">Departure</th>
            <th colSpan="2">Arrival</th>
            <th colSpan="2">Aircraft</th>
            <th colSpan="2">Single Pilot Time</th>
            <th rowSpan="2">Multi<br/>Pilot<br/>Time</th>
            <th rowSpan="2">Total<br/>Time of<br/>Flight</th>
            <th rowSpan="2">PIC Name</th>
            <th colSpan="2">Landings</th>
            <th colSpan="2">Operational<br/>Condition Time</th>
            <th colSpan="4">Pilot Function Time</th>
            <th colSpan="2">FSTD Session</th>
            <th rowSpan="2">Remarks and Endorsements</th>
          </tr>
          <tr className="sub">
            <th>Place</th><th>Time</th>
            <th>Place</th><th>Time</th>
            <th>Type</th><th>Reg</th>
            <th>SE</th><th>ME</th>
            <th>Day</th><th>Night</th>
            <th>Night</th><th>IFR</th>
            <th>PIC</th><th>COP</th><th>Dual</th><th>Instr</th>
            <th>Type</th><th>Time</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.uuid || r.record_number} onClick={() => r.uuid && onOpen(r.uuid)}>
              <td className="mono">{shortDate(r.date)}</td>
              <td>{dash(r.departure?.place)}</td><td className="mono">{dash(r.departure?.time)}</td>
              <td>{dash(r.arrival?.place)}</td><td className="mono">{dash(r.arrival?.time)}</td>
              <td>{dash(r.aircraft?.model)}</td><td>{dash(r.aircraft?.reg_name)}</td>
              <td className={rowTime(r,'se_time') ? 'mono' : 'mono muted'}>{dash(rowTime(r,'se_time'))}</td>
              <td className={rowTime(r,'me_time') ? 'mono' : 'mono muted'}>{dash(rowTime(r,'me_time'))}</td>
              <td className={rowTime(r,'mcc_time') ? 'mono' : 'mono muted'}>{dash(rowTime(r,'mcc_time'))}</td>
              <td className={rowTime(r,'total_time') ? 'mono' : 'mono muted'}>{dash(rowTime(r,'total_time'))}</td>
              <td>{dash(r.pic_name)}</td>
              <td className={rowLanding(r,'day') ? 'mono' : 'mono muted'}>{dash(rowLanding(r,'day'))}</td>
              <td className={rowLanding(r,'night') ? 'mono' : 'mono muted'}>{dash(rowLanding(r,'night'))}</td>
              <td className={rowTime(r,'night_time') ? 'mono' : 'mono muted'}>{dash(rowTime(r,'night_time'))}</td>
              <td className={rowTime(r,'ifr_time') ? 'mono' : 'mono muted'}>{dash(rowTime(r,'ifr_time'))}</td>
              <td className={rowTime(r,'pic_time') ? 'mono' : 'mono muted'}>{dash(rowTime(r,'pic_time'))}</td>
              <td className={rowTime(r,'co_pilot_time') ? 'mono' : 'mono muted'}>{dash(rowTime(r,'co_pilot_time'))}</td>
              <td className={rowTime(r,'dual_time') ? 'mono' : 'mono muted'}>{dash(rowTime(r,'dual_time'))}</td>
              <td className={rowTime(r,'instructor_time') ? 'mono' : 'mono muted'}>{dash(rowTime(r,'instructor_time'))}</td>
              <td className={r.sim?.type ? '' : 'muted'}>{dash(r.sim?.type)}</td>
              <td className={r.sim?.time ? 'mono' : 'mono muted'}>{dash(r.sim?.time)}</td>
              <td className={r.remarks ? '' : 'muted'}>{dash(r.remarks)}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan="23" className="muted">No flight found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export default function Logbook() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('all');
  const { data = [], isLoading, isError, error } = useQuery({
    queryKey:['logbook'], queryFn:({signal})=>fetchLogbookData({signal}), staleTime:3600000, gcTime:3600000
  });
  useErrorNotification({ isError, error, fallbackMessage:'Failed to load logbook' });

  const rows = useMemo(() => (Array.isArray(data) ? data.filter(r => r?.uuid !== 'previous-experience-artificial-uuid') : []), [data]);
  const currentYear = String(new Date().getFullYear());

  const summary = useMemo(() => {
    const totals = { total:0,pic:0,me:0,ifr:0,landings:0,ytotal:0,ypic:0,yme:0,yifr:0 };
    rows.forEach(r => {
      const total = toMinutes(rowTime(r,'total_time'));
      const pic = toMinutes(rowTime(r,'pic_time'));
      const me = toMinutes(rowTime(r,'me_time')) + toMinutes(rowTime(r,'mcc_time'));
      const ifr = toMinutes(rowTime(r,'ifr_time'));
      totals.total += total; totals.pic += pic; totals.me += me; totals.ifr += ifr;
      totals.landings += rowLanding(r,'day') + rowLanding(r,'night');
      if (yearOf(r.date) === currentYear) { totals.ytotal += total; totals.ypic += pic; totals.yme += me; totals.yifr += ifr; }
    });
    return totals;
  }, [rows, currentYear]);

  const filtered = useMemo(() => rows.filter((r) => {
    if (segment === 'pic' && toMinutes(rowTime(r,'pic_time')) <= 0) return false;
    if (segment === 'ifr' && toMinutes(rowTime(r,'ifr_time')) <= 0) return false;
    if (segment === 'night' && toMinutes(rowTime(r,'night_time')) <= 0) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const haystack = [r.date,r.departure?.place,r.departure?.time,r.arrival?.place,r.arrival?.time,r.aircraft?.model,r.aircraft?.reg_name,r.pic_name,r.remarks,r.tags].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(q);
  }), [rows, search, segment]);

  const last = rows[0]?.date ? humanDate(rows[0].date) : '';
  return (
    <section className="active apple-page-shell">
      <h1 className="page-title">Flight records</h1>
      <p className="page-sub">{formatMinutes(summary.total).split(':')[0].replace(/,/g,',')} hours flown · {summary.landings.toLocaleString()} landings{last ? ` · last entry on ${last}` : ''}</p>
      {isLoading && <LinearProgress sx={{ mb: 1.5, borderRadius:99 }} />}
      <div className="tiles">
        <SummaryTile title="Total time" value={formatMinutes(summary.total)} delta={formatMinutes(summary.ytotal)} total />
        <SummaryTile title="PIC" value={formatMinutes(summary.pic)} delta={formatMinutes(summary.ypic)} />
        <SummaryTile title="Multi-engine" value={formatMinutes(summary.me)} delta={formatMinutes(summary.yme)} />
        <SummaryTile title="IFR" value={formatMinutes(summary.ifr)} delta={formatMinutes(summary.yifr)} />
      </div>
      <div className="row">
        <div className="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
          <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search a flight, aircraft, airport…" />
        </div>
        <div className="segmented">
          {['all','pic','ifr','night'].map(k => <button key={k} className={segment===k?'on':''} onClick={()=>setSegment(k)}>{k==='all'?'All':k.toUpperCase()}</button>)}
        </div>
        <span className="spacer" />
        <button className="btn ghost" onClick={()=>navigate('/export')}>Export</button>
        <button className="btn primary" onClick={()=>navigate('/logbook/new')}>＋ New flight</button>
      </div>
      <EasaTable rows={filtered} onOpen={(uuid)=>navigate(`/logbook/${uuid}`)} />
    </section>
  );
}
