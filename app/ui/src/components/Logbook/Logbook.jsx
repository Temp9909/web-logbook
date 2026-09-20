import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchLogbookData } from '../../util/http/logbook';
import { useErrorNotification } from '../../hooks/useAppNotifications';
import { SelectField } from '../AppleExact/Primitives';

const PaginationChevron = ({ direction }) => (
  <svg className="exact-pagination-chevron" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path d={direction === 'left' ? 'M10 4L6 8l4 4' : 'M6 4l4 4-4 4'} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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
  const m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4}|\d{2})/);
  if (m) return `${m[1].padStart(2,'0')}/${m[2].padStart(2,'0')}/${m[3].slice(-2)}`;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1].slice(-2)}`;
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

const METRICS = [
  { key: 'total_time', label: 'Total time', read: r => r?.time?.total_time },
  { key: 'pic_time', label: 'PIC', read: r => r?.time?.pic_time },
  { key: 'se_time', label: 'Single-engine', read: r => r?.time?.se_time },
  { key: 'me_time', label: 'Multi-engine', read: r => r?.time?.me_time },
  { key: 'mcc_time', label: 'Multi-pilot', read: r => r?.time?.mcc_time },
  { key: 'night_time', label: 'Night', read: r => r?.time?.night_time },
  { key: 'ifr_time', label: 'IFR', read: r => r?.time?.ifr_time },
  { key: 'co_pilot_time', label: 'Co-pilot', read: r => r?.time?.co_pilot_time },
  { key: 'dual_time', label: 'Dual', read: r => r?.time?.dual_time },
  { key: 'instructor_time', label: 'Instructor', read: r => r?.time?.instructor_time },
  { key: 'cc_time', label: 'Cross-country', read: r => r?.time?.cc_time },
  { key: 'sim_time', label: 'FSTD / Sim', read: r => r?.sim?.time },
];
const METRIC_MAP = new Map(METRICS.map(m => [m.key, m]));
const DEFAULT_METRICS = ['total_time','pic_time','me_time','ifr_time'];

function loadSelectedMetrics() {
  try {
    const parsed = JSON.parse(localStorage.getItem('logbook-summary-metrics') || '[]');
    if (Array.isArray(parsed) && parsed.length === 4 && parsed.every(k => METRIC_MAP.has(k))) return parsed;
  } catch { /* ignore invalid local state */ }
  return DEFAULT_METRICS;
}

function loadPageSize() {
  const value = Number(localStorage.getItem('logbook-page-size') || 12);
  return [12,25,50,100].includes(value) ? value : 12;
}

function paginationItems(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const items = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) items.push('left-gap');
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < total - 1) items.push('right-gap');
  items.push(total);
  return items;
}

function SummaryTile({ title, value, delta }) {
  return <div className="card tile"><div className="cap">{title}</div><div className="val mono">{value}</div><div className="delta">+{delta} this year</div></div>;
}

function EasaTable({ rows, onOpen }) {
  const isFSTDRecord = (r) => Boolean(r?.sim?.type || r?.sim?.time);

  return (
    <div className="card table-wrap">
      <table className="easa apple-logbook-table">
        <thead>
          <tr className="num">
            <th colSpan="1">1</th>
            <th colSpan="2">2</th>
            <th colSpan="2">3</th>
            <th colSpan="2">4</th>
            <th colSpan="3">5</th>
            <th colSpan="1">6</th>
            <th colSpan="1">7</th>
            <th colSpan="2">8</th>
            <th colSpan="2">9</th>
            <th colSpan="4">10</th>
            <th colSpan="3">11</th>
            <th colSpan="1">12</th>
          </tr>
          <tr className="grp">
            <th rowSpan="2">DATE<br/>(dd/mm/yy)</th>
            <th colSpan="2">DEPARTURE</th>
            <th colSpan="2">ARRIVAL</th>
            <th colSpan="2">AIRCRAFT</th>
            <th colSpan="2">SINGLE-PILOT TIME</th>
            <th rowSpan="2">MULTI-PILOT<br/>TIME</th>
            <th rowSpan="2">TOTAL TIME<br/>OF FLIGHT</th>
            <th rowSpan="2">NAME(S) PIC</th>
            <th colSpan="2">LANDINGS</th>
            <th colSpan="2">OPERATIONAL<br/>CONDITION TIME</th>
            <th colSpan="4">PILOT FUNCTION TIME</th>
            <th colSpan="3">FSTD SESSION</th>
            <th rowSpan="2">REMARKS AND<br/>ENDORSEMENTS</th>
          </tr>
          <tr className="sub">
            <th>PLACE</th><th>TIME</th>
            <th>PLACE</th><th>TIME</th>
            <th>MAKE, MODEL,<br/>VARIANT</th><th>REGISTRATION</th>
            <th>SE</th><th>ME</th>
            <th>DAY</th><th>NIGHT</th>
            <th>NIGHT</th><th>IFR</th>
            <th>PIC</th><th>CO-PILOT</th><th>DUAL</th><th>INSTRUCTOR</th>
            <th>DATE<br/>(dd/mm/yy)</th><th>TYPE</th><th>TOTAL TIME<br/>OF SESSION</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const fstd = isFSTDRecord(r);
            return (
              <tr key={r.uuid || r.record_number} onClick={() => r.uuid && onOpen(r.uuid)}>
                <td className="mono">{fstd ? '—' : shortDate(r.date)}</td>
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
                <td className={fstd ? 'mono' : 'mono muted'}>{fstd ? shortDate(r.date) : '—'}</td>
                <td className={r.sim?.type ? '' : 'muted'}>{dash(r.sim?.type)}</td>
                <td className={r.sim?.time ? 'mono' : 'mono muted'}>{dash(r.sim?.time)}</td>
                <td className={r.remarks ? '' : 'muted'}>{dash(r.remarks)}</td>
              </tr>
            );
          })}
          {rows.length === 0 && <tr><td colSpan="24" className="muted">No flight found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export default function Logbook() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('all');
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState(loadSelectedMetrics);
  const [pageSize, setPageSize] = useState(loadPageSize);
  const [page, setPage] = useState(1);
  const { data = [], isLoading, isError, error } = useQuery({
    queryKey:['logbook'], queryFn:({signal})=>fetchLogbookData({signal}), staleTime:3600000, gcTime:3600000
  });
  useErrorNotification({ isError, error, fallbackMessage:'Failed to load logbook' });

  useEffect(() => {
    localStorage.setItem('logbook-summary-metrics', JSON.stringify(selectedMetrics));
  }, [selectedMetrics]);

  useEffect(() => {
    localStorage.setItem('logbook-page-size', String(pageSize));
  }, [pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, segment, pageSize]);

  const rows = useMemo(() => (Array.isArray(data) ? data.filter(r => r?.uuid !== 'previous-experience-artificial-uuid') : []), [data]);
  const currentYear = String(new Date().getFullYear());

  const allSummaries = useMemo(() => {
    const result = {};
    for (const metric of METRICS) result[metric.key] = { all:0, year:0 };
    let landings = 0;
    rows.forEach(r => {
      for (const metric of METRICS) {
        const mins = toMinutes(metric.read(r));
        result[metric.key].all += mins;
        if (yearOf(r.date) === currentYear) result[metric.key].year += mins;
      }
      landings += rowLanding(r,'day') + rowLanding(r,'night');
    });
    return { metrics: result, landings };
  }, [rows, currentYear]);

  const filtered = useMemo(() => rows.filter((r) => {
    if (segment === 'pic' && toMinutes(rowTime(r,'pic_time')) <= 0) return false;
    if (segment === 'ifr' && toMinutes(rowTime(r,'ifr_time')) <= 0) return false;
    if (segment === 'night' && toMinutes(rowTime(r,'night_time')) <= 0) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const haystack = [r.date,r.departure?.place,r.departure?.time,r.arrival?.place,r.arrival?.time,r.aircraft?.model,r.aircraft?.reg_name,r.pic_name,r.remarks].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(q);
  }), [rows, search, segment]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageStartIndex = filtered.length ? (safePage - 1) * pageSize : 0;
  const pageEndIndex = Math.min(pageStartIndex + pageSize, filtered.length);
  const pagedRows = filtered.slice(pageStartIndex, pageEndIndex);
  const pageItems = paginationItems(safePage, pageCount);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const setMetricSlot = (index, key) => {
    setSelectedMetrics(prev => prev.map((value, i) => i === index ? key : value));
  };

  const last = rows[0]?.date ? humanDate(rows[0].date) : '';
  const total = allSummaries.metrics.total_time?.all || 0;
  return (
    <section className="active apple-page-shell">
      <div className="apple-page-heading-row">
        <div>
          <h1 className="page-title">Flight records</h1>
          <p className="page-sub">{formatMinutes(total).split(':')[0]} hours flown · {allSummaries.landings.toLocaleString()} landings{last ? ` · last entry on ${last}` : ''}</p>
        </div>
        <button className="btn ghost apple-customize-button exact-secondary-action" onClick={()=>setCustomizeOpen(v=>!v)}>Customize totals</button>
      </div>
      {customizeOpen && (
        <div className="card apple-metrics-panel">
          <div className="apple-metrics-panel-title">Choose the four time totals shown above the logbook</div>
          <div className="apple-metric-selectors">
            {selectedMetrics.map((metricKey, index) => (
              <SelectField
                key={index}
                className="apple-metric-field"
                label={`Card ${index + 1}`}
                value={metricKey}
                onChange={(value)=>setMetricSlot(index,value)}
                options={METRICS.map((metric)=>({ value:metric.key, label:metric.label }))}
              />
            ))}
          </div>
        </div>
      )}
      <div className="tiles">
        {selectedMetrics.map((metricKey, index) => {
          const metric = METRIC_MAP.get(metricKey) || METRICS[0];
          const summary = allSummaries.metrics[metric.key] || { all:0, year:0 };
          return <SummaryTile key={`${metricKey}-${index}`} title={metric.label} value={formatMinutes(summary.all)} delta={formatMinutes(summary.year)} />;
        })}
      </div>
      <div className="row">
        <div className="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
          <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search a flight, aircraft, airport…" />
        </div>
        <div className="segmented exact-logbook-flight-filter">
          {['all','pic','ifr','night'].map(k => <button key={k} className={segment===k?'on':''} onClick={()=>setSegment(k)}>{k==='all'?'All':k.toUpperCase()}</button>)}
        </div>
        <span className="spacer" />
        <button className="btn ghost exact-secondary-action" onClick={()=>navigate('/export')}>Export</button>
        <button className="btn primary exact-primary-action" onClick={()=>navigate('/logbook/new')}>＋ New flight</button>
      </div>
      <EasaTable rows={pagedRows} onOpen={(uuid)=>navigate(`/logbook/${uuid}`)} />
      <div className="exact-logbook-pagination">
        <div className="exact-pagination-count">
          {filtered.length ? `${pageStartIndex + 1}–${pageEndIndex} of ${filtered.length} flights` : '0 flights'}
        </div>
        <SelectField
          className="exact-pagination-select-field"
          label="Rows per page"
          value={String(pageSize)}
          onChange={(value)=>setPageSize(Number(value))}
          options={[12,25,50,100].map((value)=>({ value:String(value), label:String(value) }))}
        />
        <div className="exact-page-buttons" aria-label="Logbook pages">
          <button type="button" className="exact-page-button" disabled={safePage <= 1} onClick={()=>setPage((value)=>Math.max(1,value-1))} aria-label="Previous page"><PaginationChevron direction="left" /></button>
          {pageItems.map((item,index)=>typeof item === 'number' ? (
            <button key={item} type="button" className={`exact-page-button${safePage===item?' on':''}`} onClick={()=>setPage(item)}>{item}</button>
          ) : <span key={`${item}-${index}`} className="exact-page-gap">…</span>)}
          <button type="button" className="exact-page-button" disabled={safePage >= pageCount} onClick={()=>setPage((value)=>Math.min(pageCount,value+1))} aria-label="Next page"><PaginationChevron direction="right" /></button>
        </div>
      </div>
    </section>
  );
}