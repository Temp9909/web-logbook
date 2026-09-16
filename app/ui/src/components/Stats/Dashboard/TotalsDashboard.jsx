import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import LinearProgress from '@mui/material/LinearProgress';
import { fetchLogbookData } from '../../../util/http/logbook';
import { useErrorNotification } from '../../../hooks/useAppNotifications';

const toMinutes = (value) => {
  if (!value || typeof value !== 'string') return 0;
  const [h='0',m='0'] = value.split(':');
  return (Number.parseInt(h,10)||0)*60 + (Number.parseInt(m,10)||0);
};
const fmt = (minutes) => `${Math.floor((minutes||0)/60).toLocaleString()}:${String((minutes||0)%60).padStart(2,'0')}`;
const parseDate = (value) => {
  if (!value) return null;
  const s = String(value);
  let m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (m) return new Date(Number(m[3]), Number(m[2])-1, Number(m[1]));
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2])-1, Number(m[3]));
  return null;
};
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;

export default function TotalsDashboard() {
  const { data = [], isLoading, isError, error } = useQuery({
    queryKey:['logbook'], queryFn:({signal})=>fetchLogbookData({signal}), staleTime:3600000, gcTime:3600000
  });
  useErrorNotification({ isError, error, fallbackMessage:'Failed to load logbook' });

  const stats = useMemo(() => {
    const rows = (Array.isArray(data) ? data : []).filter(r => r?.uuid !== 'previous-experience-artificial-uuid');
    const now = new Date();
    const months = [];
    for (let i=11;i>=0;i--) {
      const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
      months.push({ key:monthKey(d), label:d.toLocaleDateString('en-GB',{month:'short'}).slice(0,1).toUpperCase(), minutes:0 });
    }
    const map = new Map(months.map(m => [m.key,m]));
    let thisYear = 0;
    const types = new Set();
    rows.forEach(r => {
      const mins = toMinutes(r?.time?.total_time);
      const d = parseDate(r.date);
      if (d && map.has(monthKey(d))) map.get(monthKey(d)).minutes += mins;
      if (d && d.getFullYear() === now.getFullYear()) thisYear += mins;
      if (r?.aircraft?.model) types.add(r.aircraft.model);
    });
    const periodTotal = months.reduce((a,m)=>a+m.minutes,0);
    const avg = Math.round(periodTotal/12);
    const best = months.reduce((a,m)=>m.minutes>a.minutes?m:a, months[0] || {minutes:0,label:'—'});
    const max = Math.max(1,...months.map(m=>m.minutes));
    return { months, thisYear, types:types.size, periodTotal, avg, best, max };
  }, [data]);

  return (
    <section className="active apple-page-shell">
      <h1 className="page-title">Stats</h1>
      <p className="page-sub">Flight hours by month — last 12 months</p>
      {isLoading && <LinearProgress sx={{mb:1.5,borderRadius:99}} />}
      <div className="tiles">
        <div className="card tile"><div className="cap">This year</div><div className="val mono">{fmt(stats.thisYear)}</div></div>
        <div className="card tile"><div className="cap">Average / month</div><div className="val mono">{fmt(stats.avg)}</div></div>
        <div className="card tile"><div className="cap">Best month</div><div className="val mono">{fmt(stats.best.minutes)}</div><div className="delta">{stats.best.label}</div></div>
        <div className="card tile"><div className="cap">Aircraft types</div><div className="val mono">{stats.types}</div></div>
      </div>
      <div className="card">
        <div className="bars">
          {stats.months.map(m => <div className="bar" key={m.key}><div className="fill" style={{height:`${Math.max(3,Math.round((m.minutes/stats.max)*100))}%`}}></div><div className="cap">{m.label}</div></div>)}
        </div>
        <div className="legend">Total for the period: {fmt(stats.periodTotal)} — peak in {stats.best.label} with {fmt(stats.best.minutes)} flown.</div>
      </div>
    </section>
  );
}
