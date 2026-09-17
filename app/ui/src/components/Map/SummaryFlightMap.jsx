import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLogbookMapData } from '../../util/http/logbook';
import { fetchAirports } from '../../util/http/airport';
import { formatDistanceNM, getStats } from '../../util/helpers';
import FlightMap from '../FlightMap/FlightMap';
import { DEFAULT_MAP_OPTIONS } from '../FlightMap/helpers';
import { Card, Loading, PageHead, SelectField, SwitchRow } from '../AppleExact/Primitives';

export const SummaryFlightMap = () => {
  const { data = [], isLoading } = useQuery({queryKey:['logbook','map'],queryFn:({signal})=>fetchLogbookMapData({signal}),staleTime:3600000});
  const { data: airports = [] } = useQuery({queryKey:['airports'],queryFn:({signal})=>fetchAirports({signal}),staleTime:3600000});
  const [period,setPeriod] = useState('all');
  const [aircraft,setAircraft] = useState('all');
  const [options,setOptions] = useState(()=>{
    try { return JSON.parse(localStorage.getItem('map-advanced-options')) || DEFAULT_MAP_OPTIONS; } catch { return DEFAULT_MAP_OPTIONS; }
  });

  const airportsMap = useMemo(()=>{
    const map = new Map();
    (Array.isArray(airports)?airports:[]).forEach((a)=>{ if(a?.icao) map.set(a.icao,a); if(a?.iata) map.set(a.iata,a); });
    return map;
  },[airports]);
  const aircrafts = useMemo(()=>Array.from(new Set((Array.isArray(data)?data:[]).map(f=>f?.aircraft?.reg_name).filter(Boolean))).sort(),[data]);
  const filtered = useMemo(()=>{
    const year = new Date().getFullYear();
    return (Array.isArray(data)?data:[]).filter((f)=>{
      if(aircraft !== 'all' && f?.aircraft?.reg_name !== aircraft) return false;
      if(period === 'year') { const y = Number(String(f?.date||'').split('/')[2]); if(y !== year) return false; }
      if(period === '90') { const [d,m,y] = String(f?.date||'').split('/').map(Number); const dt = new Date(y,m-1,d); if(Number.isNaN(dt.getTime()) || Date.now()-dt.getTime()>90*86400000) return false; }
      return true;
    });
  },[data,period,aircraft]);
  const stats = useMemo(()=>getStats(filtered,airportsMap),[filtered,airportsMap]);

  const updateOption=(key,value)=>{
    setOptions((prev)=>{
      const next={...prev};
      if(key==='routes') next.routes={...prev.routes,enabled:value};
      if(key==='tracks') next.tracks={...prev.tracks,enabled:value};
      if(key==='airport') next.airport={...prev.airport,ids:value};
      localStorage.setItem('map-advanced-options',JSON.stringify(next));
      return next;
    });
  };

  return <section className="exact-react-page">
    <PageHead title="Map" subtitle="Explore your flights, routes and airports." />
    <Loading show={isLoading}/>
    <div className="split">
      <aside className="exact-map-sidebar">
        <Card title="Filters" subtitle="Choose which flights are shown on the map.">
          <div className="form-grid two">
            <SelectField label="Period" value={period} onChange={setPeriod} options={[{value:'all',label:'All time'},{value:'year',label:'This year'},{value:'90',label:'Last 90 days'}]} />
            <SelectField label="Aircraft" value={aircraft} onChange={setAircraft} options={[{value:'all',label:'All aircraft'},...aircrafts.map(v=>({value:v,label:v}))]} />
          </div>
          <div className="card rows" style={{borderRadius:10,marginTop:12}}>
            <SwitchRow label="Show airport pins" checked={options?.airport?.ids !== false} onChange={(v)=>updateOption('airport',v)} />
            <SwitchRow label="Show route lines" checked={options?.routes?.enabled !== false} onChange={(v)=>updateOption('routes',v)} />
            <SwitchRow label="Show recorded tracks" checked={options?.tracks?.enabled !== false} onChange={(v)=>updateOption('tracks',v)} />
          </div>
        </Card>
        <Card title="Summary" subtitle="Summary for visible flights.">
          <div className="exact-stat-grid">
            <div><div className="muted" style={{fontSize:11}}>FLIGHTS</div><div className="exact-stat-number">{filtered.length}</div></div>
            <div><div className="muted" style={{fontSize:11}}>AIRPORTS</div><div className="exact-stat-number">{stats?.airports ?? 0}</div></div>
            <div><div className="muted" style={{fontSize:11}}>DISTANCE (NM)</div><div className="exact-stat-number">{formatDistanceNM(stats?.totals?.distance)} NM</div></div>
            <div><div className="muted" style={{fontSize:11}}>HOURS</div><div className="exact-stat-number">{stats?.totals?.time?.total_time || '0:00'}</div></div>
          </div>
        </Card>
      </aside>
      <div className="exact-map-host"><FlightMap data={filtered} airportsMap={airportsMap} embedded optionsOverride={options} /></div>
    </div>
  </section>;
};
export default SummaryFlightMap;
