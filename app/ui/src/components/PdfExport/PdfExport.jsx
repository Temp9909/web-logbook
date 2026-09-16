import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchSettings, fetchPdfDefaults, updatePdfSettings } from '../../util/http/settings';
import { fetchExport } from '../../util/http/export';
import { queryClient } from '../../util/http/http';
import { Card, Field, Loading, PageHead, SwitchRow } from '../AppleExact/Primitives';

const downloadBlob=(blob,name)=>{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)};
const numericFields=[['logbook_rows','Rows per page'],['fill','Fill every X row'],['top_margin','Top margin'],['body_row_height','Row height'],['footer_row_height','Footer row height']];

export const PdfExport=({format})=>{
  const navigate=useNavigate();
  const [settings,setSettings]=useState({columns:{},headers:{}});
  const {data,isLoading}=useQuery({queryKey:['settings'],queryFn:({signal})=>fetchSettings({signal})});
  useEffect(()=>{if(data){setSettings(format==='A4'?data.export_a4:data.export_a5)}},[data,format]);
  const save=useMutation({mutationFn:()=>updatePdfSettings({settings,format}),onSuccess:()=>queryClient.invalidateQueries({queryKey:['settings']})});
  const restore=useMutation({mutationFn:()=>fetchPdfDefaults({format}),onSuccess:(v)=>setSettings(v)});
  const exp=useMutation({mutationFn:()=>fetchExport(format),onSuccess:(blob)=>downloadBlob(blob,`logbook-${format.toLowerCase()}.pdf`)});
  const change=(key,val)=>setSettings(p=>({...p,[key]:val}));
  return <section className="exact-react-page">
    <PageHead title="Export" subtitle={`Configure and preview your ${format} PDF logbook.`} actions={<><button className="btn ghost" disabled={restore.isPending} onClick={()=>restore.mutate()}>Restore defaults</button><button className="btn" disabled={save.isPending} onClick={()=>save.mutate()}>{save.isPending?'Saving…':'Save settings'}</button><button className="btn primary" disabled={exp.isPending} onClick={()=>exp.mutate()}>{exp.isPending?'Preparing…':'Export PDF'}</button></>} />
    <Loading show={isLoading||save.isPending||restore.isPending||exp.isPending}/>
    <div className="mini-tabs"><button className={format==='A4'?'on':''} type="button" onClick={()=>navigate('/export/a4')}>A4</button><button className={format==='A5'?'on':''} type="button" onClick={()=>navigate('/export/a5')}>A5</button></div>
    <div className="split">
      <div className="grid">
        <Card title="Page settings" subtitle="Choose the page layout used in the exported logbook.">
          <div className="form-grid two">
            <Field label="Paper" value={format} readOnly/>
            {numericFields.map(([key,label])=><Field key={key} label={label} value={settings?.[key]??''} onChange={v=>change(key,v)}/>)}
            {format==='A4'?<Field label="Left margin" value={settings.left_margin??''} onChange={v=>change('left_margin',v)}/>:<><Field label="Left margin (L)" value={settings.left_margin_a??''} onChange={v=>change('left_margin_a',v)}/><Field label="Left margin (R)" value={settings.left_margin_b??''} onChange={v=>change('left_margin_b',v)}/></>}
            <Field label="Page breaks" value={settings.page_breaks??''} onChange={v=>change('page_breaks',v)} placeholder="3,7,11"/>
          </div>
        </Card>
        <Card title="Other settings" subtitle="Fine-tune information included in the PDF.">
          <div className="card rows" style={{borderRadius:10}}>
            <SwitchRow label="Include signature" checked={Boolean(settings.include_signature)} onChange={v=>change('include_signature',v)}/>
            <SwitchRow label="Extended Part FCL.050 format" checked={Boolean(settings.is_extended)} onChange={v=>change('is_extended',v)}/>
            <SwitchRow label="Replace single-pilot times with ✓" checked={Boolean(settings.replace_sp_time)} onChange={v=>change('replace_sp_time',v)}/>
          </div>
        </Card>
        <Card title="Column widths" subtitle="Set a width to 0 to hide a column.">
          <div className="form-grid">
            {Object.keys(settings.columns||{}).map(key=><Field key={key} label={key.toUpperCase()} value={settings.columns[key]??''} onChange={v=>setSettings(p=>({...p,columns:{...p.columns,[key]:v}}))}/>) }
          </div>
        </Card>
      </div>
      <Card title="Preview" subtitle="Preview of the exported logbook.">
        <div className="exact-preview-sheet"><div style={{textAlign:'center',marginTop:28}}><div className="muted" style={{fontSize:12,textTransform:'uppercase',letterSpacing:'.08em'}}>Pilot logbook</div><h1 style={{fontSize:34,margin:'8px 0'}}>Web Logbook</h1><div className="muted">{format} · EASA flight records</div></div><div style={{height:90}}/><div className="exact-preview-line"/><div className="exact-preview-line"/><div className="exact-preview-line med"/><div style={{height:85}}/><div className="exact-preview-line short"/></div>
      </Card>
    </div>
  </section>
};
export default PdfExport;
