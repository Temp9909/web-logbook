import { useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import { API_URL } from '../../constants/constants';
import { getAuthToken } from '../../util/auth';
import { queryClient } from '../../util/http/http';
import { autoTimeRecog, convertToDDMMYYYY, marshallItem } from './helpers';
import { Card, Chip, Modal, NativeTable, PageHead, SelectField, SwitchRow } from '../AppleExact/Primitives';

const FIELDS=[
  ['date','Date','Date'],['departure_place','Departure Place','Departure Place'],['departure_time','Departure Time','Departure Time'],['arrival_place','Arrival Place','Arrival Place'],['arrival_time','Arrival Time','Arrival Time'],['aircraft_model','Aircraft Model','Aircraft Model'],['aircraft_reg_name','Aircraft Reg','Aircraft Reg'],['se_time','SE Time','Time SE'],['me_time','ME Time','Time ME'],['mcc_time','MCC Time','Time MCC'],['total_time','Total Time','Time Total'],['night_time','Night Time','Time Night'],['ifr_time','IFR Time','Time IFR'],['pic_time','PIC Time','Time PIC'],['co_pilot_time','Co-pilot Time','Time CoPilot'],['dual_time','Dual Time','Time Dual'],['instructor_time','Instructor Time','Time Instructor'],['landings_day','Day Landings','Landings Day'],['landings_night','Night Landings','Landings Night'],['sim_type','FSTD Type','SIM Type'],['sim_time','FSTD Time','SIM Time'],['pic_name','PIC Name','PIC Name'],['remarks','Remarks','Remarks'],['tags','Tags','Tags']
];

const buildRows=(raw,headers,mapping)=>raw.slice(1).map((row,index)=>{
  const item={generated_id:index};
  Object.entries(mapping).forEach(([key,header])=>{ if(header) item[key]=row[headers.indexOf(header)] ?? ''; });
  if(!item.date)return null;
  item.date=convertToDDMMYYYY(item.date);item.departure_time=autoTimeRecog(item.departure_time);item.arrival_time=autoTimeRecog(item.arrival_time);
  if(item.departure_place?.includes('-')){const [a,b]=item.departure_place.toUpperCase().split('-');item.departure_place=a.trim();item.arrival_place=b?.trim()||item.arrival_place;}
  if(item.tags)item.tags=item.tags.replace(/[;|]/g,',');
  return marshallItem(item);
}).filter(Boolean);

export const Import=()=>{
  const fileRef=useRef(null);const [headers,setHeaders]=useState([]);const [raw,setRaw]=useState([]);const [mapping,setMapping]=useState({});const [data,setData]=useState([]);const [mapOpen,setMapOpen]=useState(false);const [optionsOpen,setOptionsOpen]=useState(false);const [progressOpen,setProgressOpen]=useState(false);const [options,setOptions]=useState({create_persons:false,create_person_format:'fn_mn_ln',create_person_from:{pic:true}});const [progress,setProgress]=useState({current:0,total:0,status:'idle',message:''});
  const parseFile=(file)=>Papa.parse(file,{complete:(result)=>{const rows=result.data||[];const hs=rows[0]||[];setRaw(rows);setHeaders(hs);const auto={};FIELDS.forEach(([id,,def])=>{if(hs.includes(def))auto[id]=def});setMapping(auto);setMapOpen(true);}});
  const applyMapping=()=>{setData(buildRows(raw,headers,mapping));setMapOpen(false)};
  const runImport=async()=>{
    setProgressOpen(true);setProgress({current:0,total:data.length,status:'running',message:''});
    const payload={options,data:data.map(item=>({...item,custom_fields:typeof item.custom_fields==='string'?item.custom_fields:JSON.stringify(item.custom_fields||{})}))};
    try{
      const response=await fetch(`${API_URL}/import/run`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${getAuthToken()}`},body:JSON.stringify(payload)});
      if(!response.ok)throw new Error(`Import failed: ${response.statusText}`);
      const reader=response.body.getReader();const decoder=new TextDecoder();let buffer='';
      while(true){const {value,done}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const lines=buffer.split('\n');buffer=lines.pop();for(const line of lines){if(!line.trim())continue;try{const chunk=JSON.parse(line);setProgress(p=>{const next={...p};if(chunk.type==='progress'){next.current=chunk.current;next.total=chunk.total}if(chunk.type==='result'){next.current=chunk.current;next.total=chunk.total;next.status=chunk.ok?'success':'error';next.message=chunk.message||''}return next});}catch{}}}
      await queryClient.invalidateQueries();
    }catch(error){setProgress(p=>({...p,status:'error',message:error.message}))}
  };
  const columns=useMemo(()=>[
    {key:'date',label:'Date'},{key:'dep',label:'Departure',render:r=>`${r.departure?.place||''} ${r.departure?.time||''}`},{key:'arr',label:'Arrival',render:r=>`${r.arrival?.place||''} ${r.arrival?.time||''}`},{key:'aircraft',label:'Aircraft',render:r=>`${r.aircraft?.model||''} / ${r.aircraft?.reg_name||''}`},{key:'total',label:'Total',render:r=>r.time?.total_time||''},{key:'pic_name',label:'PIC'},{key:'status',label:'Status',render:()=> <Chip kind="ok">Ready</Chip>,searchValue:()=>''}
  ],[]);
  return <section className="exact-react-page">
    <PageHead title="Import" subtitle="Import flight records from a CSV file." />
    <Card title="CSV import" subtitle="Open a CSV file, review the rows and run the import when everything looks correct.">
      <div className="upload" onClick={()=>fileRef.current?.click()}><strong>Drop a CSV file here</strong><span>or click to choose a file from your computer</span><div style={{marginTop:14}}><button className="btn primary" type="button">Open CSV</button></div><input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={e=>e.target.files?.[0]&&parseFile(e.target.files[0])}/></div>
      <div className="toolbar" style={{marginTop:14}}><button className="btn ghost" disabled={!headers.length} onClick={()=>setMapOpen(true)}>Map fields</button><button className="btn ghost" onClick={()=>setOptionsOpen(true)}>Import options</button><span className="spacer"/><button className="btn danger" disabled={!data.length} onClick={()=>setData([])}>Clear table</button><button className="btn primary" disabled={!data.length||progress.status==='running'} onClick={runImport}>Run import</button></div>
      <NativeTable rows={data} columns={columns} rowKey={(r,i)=>r.uuid||i} searchable={false} empty="Open a CSV file to preview import rows." />
    </Card>
    <Modal open={mapOpen} title="Map fields" onClose={()=>setMapOpen(false)} width={900} actions={<><button className="btn" onClick={()=>setMapOpen(false)}>Back</button><button className="btn primary" disabled={!mapping.date} onClick={applyMapping}>Done</button></>}>
      <div className="form-grid three">{FIELDS.map(([id,label])=><SelectField key={id} label={label} value={mapping[id]||''} onChange={v=>setMapping(p=>({...p,[id]:v}))} options={[{value:'',label:'— Not mapped —'},...headers.map(h=>({value:h,label:h}))]}/>)}</div>
    </Modal>
    <Modal open={optionsOpen} title="Import options" onClose={()=>setOptionsOpen(false)} actions={<button className="btn primary" onClick={()=>setOptionsOpen(false)}>Done</button>}>
      <div className="card rows" style={{borderRadius:10}}><SwitchRow label="Create persons" sub="Create persons from imported PIC Name values." checked={options.create_persons} onChange={v=>setOptions(p=>({...p,create_persons:v,create_person_from:{pic:true}}))}/></div>
    </Modal>
    <Modal open={progressOpen} title="Importing flight records" onClose={()=>progress.status==='running'?null:setProgressOpen(false)} actions={<button className="btn primary" disabled={progress.status==='running'} onClick={()=>setProgressOpen(false)}>OK</button>}>
      <div className="note">{progress.status==='running'?`Processing ${progress.current} of ${progress.total}`:progress.message||progress.status}</div>
    </Modal>
  </section>;
};
export default Import;
