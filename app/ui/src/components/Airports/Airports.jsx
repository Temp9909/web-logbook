import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createCustomAirport, deleteCustomAirport, fetchCustomAirports, fetchStandardAirports, updateAirportsDB, updateCustomAirport } from '../../util/http/airport';
import { updateAirportsDBSettings } from '../../util/http/settings';
import { queryClient } from '../../util/http/http';
import useSettings from '../../hooks/useSettings';
import { Card, Field, Loading, Modal, NativeTable, PageHead, SelectField, SwitchRow } from '../AppleExact/Primitives';

const DB_OPTIONS = [
  'https://github.com/vsimakhin/Airports/raw/master/airports.json',
  'https://github.com/mwgg/Airports/raw/master/airports.json',
  'https://davidmegginson.github.io/ourairports-data/airports.csv',
];
const emptyAirport={name:'',city:'',country:'',elevation:0,lat:'',lon:'',isNew:true};

export const Airports = () => {
  const { data: standard = [], isLoading: standardLoading } = useQuery({queryKey:['airports'],queryFn:({signal})=>fetchStandardAirports({signal}),staleTime:3600000});
  const { data: custom = [], isLoading: customLoading } = useQuery({queryKey:['custom-airports'],queryFn:({signal})=>fetchCustomAirports({signal}),staleTime:3600000});
  const { data: settings = {} } = useSettings();
  const [dbSource,setDbSource]=useState(null);
  const [noIcao,setNoIcao]=useState(null);
  const [airport,setAirport]=useState(null);
  const source = dbSource ?? settings?.airports_db_source ?? DB_OPTIONS[0];
  const noIcaoValue = noIcao ?? settings?.no_icao_filter ?? false;

  const saveDbSettings=useMutation({mutationFn:({sourceValue,filterValue})=>updateAirportsDBSettings({settings:{...settings,airports_db_source:sourceValue,no_icao_filter:filterValue}}),onSuccess:()=>queryClient.invalidateQueries({queryKey:['settings']})});
  const refreshDb=useMutation({mutationFn:updateAirportsDB,onSuccess:()=>queryClient.invalidateQueries({queryKey:['airports']})});
  const saveAirport=useMutation({mutationFn:()=>{
    const payload={name:airport.name,city:airport.city,country:airport.country,elevation:parseInt(airport.elevation)||0,lat:parseFloat(airport.lat)||0,lon:parseFloat(airport.lon)||0};
    return airport.isNew ? createCustomAirport({payload}) : updateCustomAirport({payload});
  },onSuccess:async()=>{await queryClient.invalidateQueries({queryKey:['custom-airports']});setAirport(null);}});
  const removeAirport=useMutation({mutationFn:(row)=>deleteCustomAirport({payload:row}),onSuccess:()=>queryClient.invalidateQueries({queryKey:['custom-airports']})});

  const standardCols=useMemo(()=>[
    {key:'icao',label:'ICAO'},{key:'iata',label:'IATA'},{key:'name',label:'Name'},{key:'city',label:'City'},{key:'country',label:'Country'},{key:'elevation',label:'Elevation',render:r=>r.elevation ? `${r.elevation} ft` : '—'}
  ],[]);
  const customCols=useMemo(()=>[
    {key:'name',label:'Name / code'},{key:'city',label:'City'},{key:'country',label:'Country'},{key:'lat',label:'Lat'},{key:'lon',label:'Lon'},
    {key:'actions',label:'',render:(r)=><div className="exact-actions-cell"><button className="btn small" onClick={(e)=>{e.stopPropagation();setAirport({...r,isNew:false});}}>Edit</button><button className="btn danger small" onClick={(e)=>{e.stopPropagation();if(confirm('Delete this custom airport?'))removeAirport.mutate(r);}}>Delete</button></div>,searchValue:()=>''}
  ],[removeAirport]);

  const saveSource=(newSource,newFilter)=>{
    setDbSource(newSource);setNoIcao(newFilter);
    saveDbSettings.mutate({sourceValue:newSource,filterValue:newFilter});
  };

  return <section className="exact-react-page">
    <PageHead title="Airports" subtitle="Standard airports, database source and your custom airports." />
    <Card title="Standard airports" subtitle="Browse the airport database used by the logbook." className="exact-panel-section-block">
      <NativeTable rows={standard} columns={standardCols} rowKey={(r,i)=>r.icao||r.iata||i} loading={standardLoading} searchPlaceholder="ICAO, IATA, city…" />
    </Card>
    <div className="grid two" style={{marginTop:12}}>
      <Card title="Airport DB source" subtitle="Choose the source and refresh the airports database." actions={<button className="btn primary small" disabled={refreshDb.isPending} onClick={()=>refreshDb.mutate()}>{refreshDb.isPending?'Updating…':'Update DB'}</button>}>
        <SelectField label="Source URL" value={source} onChange={(v)=>saveSource(v,noIcaoValue)} options={DB_OPTIONS} />
        <div className="card rows" style={{borderRadius:10,marginTop:12}}><SwitchRow label="Filter airports without ICAO" sub="Ignore entries that cannot be identified reliably." checked={Boolean(noIcaoValue)} onChange={(v)=>saveSource(source,v)} /></div>
        <Loading show={saveDbSettings.isPending || refreshDb.isPending}/>
      </Card>
      <Card title="Custom airports" subtitle="Create and manage your own airports." actions={<button className="btn primary small" onClick={()=>setAirport({...emptyAirport})}>＋ Add</button>}>
        <NativeTable rows={custom} columns={customCols} rowKey={(r,i)=>r.name||i} loading={customLoading} searchable={false} />
      </Card>
    </div>
    <Modal open={!!airport} title={airport?.isNew ? 'Add custom airport' : 'Edit custom airport'} onClose={()=>setAirport(null)} actions={<><button className="btn" onClick={()=>setAirport(null)}>Cancel</button><button className="btn primary" disabled={saveAirport.isPending || !airport?.name} onClick={()=>saveAirport.mutate()}>Save airport</button></>}>
      {airport ? <div className="form-grid two"><Field label="Name / code" value={airport.name||''} disabled={!airport.isNew} onChange={(v)=>setAirport(p=>({...p,name:v.toUpperCase()}))}/><Field label="City" value={airport.city||''} onChange={(v)=>setAirport(p=>({...p,city:v}))}/><Field label="Country" value={airport.country||''} onChange={(v)=>setAirport(p=>({...p,country:v}))}/><Field label="Elevation" type="number" value={airport.elevation??''} onChange={(v)=>setAirport(p=>({...p,elevation:v}))}/><Field label="Latitude" value={airport.lat??''} onChange={(v)=>setAirport(p=>({...p,lat:v}))}/><Field label="Longitude" value={airport.lon??''} onChange={(v)=>setAirport(p=>({...p,lon:v}))}/></div>:null}
      <Loading show={saveAirport.isPending}/>
    </Modal>
  </section>;
};
export default Airports;
