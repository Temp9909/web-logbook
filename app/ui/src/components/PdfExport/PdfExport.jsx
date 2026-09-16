import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchSettings, fetchPdfDefaults, updatePdfSettings } from '../../util/http/settings';
import { fetchExport, fetchExportPreview } from '../../util/http/export';
import { queryClient } from '../../util/http/http';
import { Card, Field, Loading, PageHead, SwitchRow } from '../AppleExact/Primitives';

const downloadBlob=(blob,name)=>{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)};
const numericFields=[['logbook_rows','Rows per page'],['fill','Fill every X row'],['top_margin','Top margin'],['body_row_height','Row height'],['footer_row_height','Footer row height']];
const numericSettingKeys=['logbook_rows','fill','left_margin','left_margin_a','left_margin_b','top_margin','body_row_height','footer_row_height','time_fields_auto_format'];
const asNumber=(value)=>{const n=Number(value);return Number.isFinite(n)?n:0};
const normalizePdfSettings=(source)=>{
  const next={...source,columns:{...(source?.columns||{})}};
  numericSettingKeys.forEach((key)=>{if(key in next)next[key]=asNumber(next[key])});
  Object.keys(next.columns).forEach((key)=>{next.columns[key]=asNumber(next.columns[key])});
  return next;
};

export const PdfExport=({format})=>{
  const navigate=useNavigate();
  const [settings,setSettings]=useState({columns:{},headers:{}});
  const [previewUrl,setPreviewUrl]=useState('');
  const [previewError,setPreviewError]=useState('');
  const {data,isLoading}=useQuery({queryKey:['settings'],queryFn:({signal})=>fetchSettings({signal})});

  const replacePreview=(blob)=>{
    const next=URL.createObjectURL(blob);
    setPreviewUrl((current)=>{if(current) URL.revokeObjectURL(current);return next});
  };

  const preview=useMutation({
    mutationFn:(previewSettings)=>fetchExportPreview({format,settings:normalizePdfSettings(previewSettings)}),
    onMutate:()=>setPreviewError(''),
    onSuccess:(blob)=>replacePreview(blob),
    onError:(error)=>setPreviewError(error?.info?.message||error?.message||'Could not generate the PDF preview.'),
  });

  useEffect(()=>{
    if(!data)return;
    const next=format==='A4'?data.export_a4:data.export_a5;
    setSettings(next);
    preview.mutate(next);
  // preview.mutate is intentionally omitted: reload only when the loaded format/settings change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[data,format]);

  useEffect(()=>()=>{if(previewUrl)URL.revokeObjectURL(previewUrl)},[previewUrl]);

  const save=useMutation({
    mutationFn:()=>updatePdfSettings({settings:normalizePdfSettings(settings),format}),
    onSuccess:()=>{queryClient.invalidateQueries({queryKey:['settings']});preview.mutate(settings)},
  });
  const restore=useMutation({
    mutationFn:()=>fetchPdfDefaults({format}),
    onSuccess:(v)=>{setSettings(v);preview.mutate(v)},
  });
  const exp=useMutation({mutationFn:()=>fetchExport(format),onSuccess:(blob)=>downloadBlob(blob,`logbook-${format.toLowerCase()}.pdf`)});
  const change=(key,val)=>setSettings(p=>({...p,[key]:val}));

  return <section className="exact-react-page">
    <PageHead title="Export" subtitle={`Configure and preview your ${format} PDF logbook.`} actions={<><button className="btn ghost" disabled={restore.isPending} onClick={()=>restore.mutate()}>Restore defaults</button><button className="btn" disabled={save.isPending} onClick={()=>save.mutate()}>{save.isPending?'Saving…':'Save settings'}</button><button className="btn primary" disabled={exp.isPending} onClick={()=>exp.mutate()}>{exp.isPending?'Preparing…':'Export PDF'}</button></>} />
    <Loading show={isLoading||save.isPending||restore.isPending||exp.isPending||preview.isPending}/>
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
            {Object.keys(settings.columns||{}).map(key=><Field key={key} label={key.toUpperCase()} value={settings.columns[key]??''} onChange={v=>setSettings(p=>({...p,columns:{...p.columns,[key]:v}}))}/>)}
          </div>
        </Card>
      </div>
      <Card
        title="Preview"
        subtitle="Real preview generated from your logbook and the current settings."
        actions={<button className="btn small" type="button" disabled={preview.isPending||isLoading} onClick={()=>preview.mutate(settings)}>{preview.isPending?'Generating…':'Refresh preview'}</button>}
      >
        {previewError?<div className="note exact-preview-error">{previewError}</div>:null}
        {!previewError&&previewUrl?<iframe className="exact-pdf-preview-frame" src={previewUrl} title={`${format} PDF preview`} />:null}
        {!previewError&&!previewUrl?<div className="exact-preview-loading">Generating real PDF preview…</div>:null}
      </Card>
    </div>
  </section>
};
export default PdfExport;
