import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import SignaturePad from 'signature_pad';
import useSettings from '../../hooks/useSettings';
import useCustomFields from '../../hooks/useCustomFields';
import { createCustomField, deleteCustomField, updateCustomField } from '../../util/http/fields';
import { updateSettings, updateSignature } from '../../util/http/settings';
import { queryClient } from '../../util/http/http';
import { downloadDBFile, uploadDBFile } from '../../util/http/db';
import { CUSTOM_FIELD_INITIAL_STATE } from '../../constants/constants';
import { Card, Field, Loading, Modal, NativeTable, PageHead, SelectField, SwitchRow, TextArea, setNested } from '../AppleExact/Primitives';
import Airports from '../Airports/Airports';

const standardLabels={date:'Date',departure:'Departure Header',dep_place:'Place',dep_time:'Time',arrival:'Arrival Header',arr_place:'Place',arr_time:'Time',aircraft:'Aircraft Header',model:'Type',reg:'Reg',spt:'Single Pilot Header',se:'SE',me:'ME',mcc:'MCC Time',total:'Total Time',pic_name:'PIC Name',landings:'Landings',land_day:'Day',land_night:'Night',oct:'Operational Condition Time',night:'Night',ifr:'IFR',pft:'Pilot Function Time',pic:'PIC',cop:'CoPilot',dual:'Dual',instr:'Instr',fstd:'FSTD',sim_type:'Type',sim_time:'Time',remarks:'Remarks',tags:'Tags'};
const previousFields=[['total_time','Total time'],['se_time','SP SE'],['me_time','SP ME'],['mcc_time','Multi-pilot'],['night_time','Night'],['ifr_time','IFR'],['pic_time','PIC'],['co_pilot_time','Co-pilot'],['dual_time','Dual'],['instructor_time','Instructor'],['sim_time','FSTD / Sim'],['me_total_time','Total ME'],['cc_time','Cross country'],['landings_day','Day landings'],['landings_night','Night landings']];
const fieldTypes=['text','number','time','duration','enroute'];
const statsByType={text:['none','count'],number:['none','sum','average','count'],time:['none','count'],duration:['none','sum','average','count'],enroute:['none']};
const switchColors=[['#34C759','Green'],['#007AFF','Blue'],['#FF9500','Orange'],['#FF3B30','Red'],['#AF52DE','Purple'],['#FF2D55','Pink'],['#5AC8FA','Teal'],['#FFCC00','Yellow']];

function SignatureEditor({settings,setSettings,onSave}){
  const canvasRef=useRef(null);const padRef=useRef(null);const fileRef=useRef(null);
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const ratio=Math.max(window.devicePixelRatio||1,1);canvas.width=canvas.offsetWidth*ratio;canvas.height=160*ratio;canvas.getContext('2d').scale(ratio,ratio);
    const pad=new SignaturePad(canvas,{penColor:settings.penColor||'#000000'});padRef.current=pad;
    if(settings.signature_image){try{pad.fromDataURL(settings.signature_image)}catch{/* ignore */}}
    const sync=()=>{if(!pad.isEmpty())setSettings(p=>({...p,signature_image:pad.toDataURL()}))};pad.addEventListener('endStroke',sync);
    return()=>{pad.removeEventListener('endStroke',sync);pad.off()};
  },[]);
  useEffect(()=>{if(padRef.current)padRef.current.penColor=settings.penColor||'#000000'},[settings.penColor]);
  const upload=(file)=>{if(!file)return;const reader=new FileReader();reader.onload=()=>{setSettings(p=>({...p,signature_image:reader.result}));padRef.current?.fromDataURL(reader.result)};reader.readAsDataURL(file)};
  return <Card title="Logbook signature" subtitle="Draw or upload the signature used on signed records." actions={<><input ref={fileRef} hidden type="file" accept="image/*" onChange={e=>upload(e.target.files?.[0])}/><button className="btn small" onClick={()=>fileRef.current?.click()}>Upload</button><input aria-label="Signature color" type="color" value={settings.penColor||'#000000'} onChange={e=>setSettings(p=>({...p,penColor:e.target.value}))}/><button className="btn danger small" onClick={()=>{padRef.current?.clear();setSettings(p=>({...p,signature_image:''}))}}>Clear</button><button className="btn primary small" onClick={onSave}>Save</button></>}><div className="signature"><canvas ref={canvasRef} style={{width:'100%',height:160,display:'block'}}/></div></Card>
}

export const Settings=()=>{
  const dbFileRef=useRef(null);
  const [searchParams,setSearchParams]=useSearchParams();
  const allowedTabs=['general','previous','signature','standard','custom','airports'];
  const requestedTab=searchParams.get('tab');
  const initialTab=allowedTabs.includes(requestedTab)?requestedTab:'general';
  const {data,isLoading}=useSettings();const {data:customFields=[],isCustomFieldsLoading}=useCustomFields();const [settings,setSettings]=useState({});const [tab,setTab]=useState(initialTab);const [field,setField]=useState(null);
  useEffect(()=>{if(data)setSettings(data)},[data]);
  useEffect(()=>{
    const next=searchParams.get('tab');
    if(allowedTabs.includes(next) && next!==tab)setTab(next);
  },[searchParams,tab]);
  const selectTab=useCallback((id)=>{
    setTab(id);
    if(id==='general')setSearchParams({}, {replace:true});
    else setSearchParams({tab:id}, {replace:true});
  },[setSearchParams]);
  const change=useCallback((key,value)=>setSettings(prev=>setNested(prev,key,value)),[]);
  const changeSwitchColor=useCallback((value)=>{change('switch_color',value);if(/^#[0-9a-f]{6}$/i.test(value))document.documentElement.style.setProperty('--switch-on-color',value);else document.documentElement.style.removeProperty('--switch-on-color')},[change]);
  const save=useMutation({mutationFn:()=>updateSettings({settings}),onSuccess:()=>queryClient.invalidateQueries({queryKey:['settings']})});
  const saveSignature=useMutation({mutationFn:()=>updateSignature({settings}),onSuccess:()=>queryClient.invalidateQueries({queryKey:['settings']})});
  const downloadDb=useMutation({mutationFn:downloadDBFile,onSuccess:(blob)=>{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='web-logbook.sql';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)}});
  const uploadDb=useMutation({mutationFn:(form)=>uploadDBFile({payload:form}),onSuccess:()=>queryClient.invalidateQueries()});
  const saveField=useMutation({mutationFn:()=>field.uuid==='new'?createCustomField({field}):updateCustomField({field}),onSuccess:async()=>{await queryClient.invalidateQueries({queryKey:['custom-fields']});setField(null)}});
  const removeField=useMutation({mutationFn:(uuid)=>deleteCustomField({uuid}),onSuccess:()=>queryClient.invalidateQueries({queryKey:['custom-fields']})});
  const customCols=useMemo(()=>[
    {key:'display_order',label:'Order'},{key:'name',label:'Name'},{key:'description',label:'Description'},{key:'category',label:'Category'},{key:'type',label:'Type'},{key:'stats_function',label:'Stats function'},
    {key:'actions',label:'',render:r=><div className="exact-actions-cell"><button className="btn small" onClick={e=>{e.stopPropagation();setField({...r})}}>Edit</button><button className="btn danger small" onClick={e=>{e.stopPropagation();if(confirm('Delete this custom field?'))removeField.mutate(r.uuid)}}>Delete</button></div>,searchValue:()=>''}
  ],[removeField]);
  const tabs=[['general','General'],['previous','Previous flight experience'],['signature','Logbook signature'],['standard','Standard fields'],['custom','Custom fields'],['airports','Airports']];
  return <section className="exact-react-page">
    <PageHead title="Settings" subtitle="Configure your logbook, fields, signature, airports and previous experience." actions={['general','previous','standard'].includes(tab)?<button className="btn primary" disabled={save.isPending} onClick={()=>save.mutate()}>{save.isPending?'Saving…':'Save settings'}</button>:null}/>
    <Loading show={isLoading||save.isPending}/>
    <div className="settings-tabs">{tabs.map(([id,label])=><button key={id} className={tab===id?'on':''} onClick={()=>selectTab(id)}>{label}</button>)}</div>

    {tab==='general'?<div className="grid two">
      <Card title="General settings" subtitle="Owner information, application options and authentication.">
        <div className="section-label">Owner information</div><div className="form-grid two"><Field label="Owner name" value={settings.owner_name||''} onChange={v=>change('owner_name',v)}/><Field label="Licence number" value={settings.license_number||''} onChange={v=>change('license_number',v)}/><Field label="Address" value={settings.address||''} onChange={v=>change('address',v)}/><Field label="Signature text" value={settings.signature_text||''} onChange={v=>change('signature_text',v)}/></div>
        <div className="section-label" style={{marginTop:15}}>Logbook</div><div className="form-grid two"><Field label="Logbook pagination" value={settings.logbook_pagination||''} onChange={v=>change('logbook_pagination',v)}/><Field label="Self PIC label" value={settings.self_pic_label||'Self'} onChange={v=>change('self_pic_label',v)}/><Field label="Expiry warning period (days)" type="number" value={settings.licenses_expiration?.warning_period||90} onChange={v=>change('licenses_expiration.warning_period',v)}/></div>
        <div className="card rows" style={{borderRadius:10,marginTop:12}}><SwitchRow label="Show licence warning" checked={Boolean(settings.licenses_expiration?.show_warning)} onChange={v=>change('licenses_expiration.show_warning',v)}/><SwitchRow label="Show expired licences" checked={Boolean(settings.licenses_expiration?.show_expired)} onChange={v=>change('licenses_expiration.show_expired',v)}/></div>
        <div className="section-label" style={{marginTop:15}}>Appearance</div>
        <div className="card rows" style={{borderRadius:10}}>
          <div className="setting-row">
            <div><div className="lbl">On / Off switch color</div><div className="sub">Choose the color used when switches are enabled across the app.</div></div>
            <span className="spacer"/>
            <div className="switch-color-settings">
              <div className="switch-color-swatches" aria-label="Switch color presets">
                {switchColors.map(([color,name])=><button key={color} type="button" title={name} aria-label={name} className={`switch-color-swatch${(settings.switch_color||'#34C759').toUpperCase()===color?' selected':''}`} style={{background:color}} onClick={()=>changeSwitchColor(color)}/>)}
              </div>
              <input className="switch-color-custom" aria-label="Custom switch color" title="Custom color" type="color" value={settings.switch_color||'#34C759'} onChange={e=>changeSwitchColor(e.target.value)}/>
              <button type="button" className="btn small" onClick={()=>changeSwitchColor('')}>Default</button>
            </div>
          </div>
        </div>
      </Card>
      <Card title="Security & database" subtitle="Authentication, formatting and database operations.">
        <div className="card rows" style={{borderRadius:10}}><SwitchRow label="Enable authentication" checked={Boolean(settings.auth_enabled)} onChange={v=>{change('auth_enabled',v);if(v&&!settings.secret_key){const a=new Uint8Array(32);crypto.getRandomValues(a);change('secret_key',btoa(String.fromCharCode.apply(null,a)))}}}/></div>
        <div className="form-grid two" style={{marginTop:12}}><Field label="Login" value={settings.login||''} disabled={!settings.auth_enabled} onChange={v=>change('login',v)}/><Field label="Password" type="password" value={settings.password||''} disabled={!settings.auth_enabled} onChange={v=>change('password',v)}/><Field label="Secret key" value={settings.secret_key||''} disabled={!settings.auth_enabled} onChange={v=>change('secret_key',v)}/><SelectField label="Time fields autoformat" value={String(settings.time_fields_auto_format??0)} onChange={v=>change('time_fields_auto_format',Number(v))} options={[{value:'0',label:'None'},{value:'1',label:'HH:MM'},{value:'2',label:'H:MM'}]}/><SelectField label="Logbook totals view" value={String(settings.logbook_totals_view??0)} onChange={v=>change('logbook_totals_view',Number(v))} options={[{value:'0',label:'Standard'},{value:'1',label:'Paper Logbook'}]}/></div>
        <div className="section-label" style={{marginTop:15}}>Data</div>
        <div className="card rows" style={{borderRadius:10}}><div className="setting-row"><div><div className="lbl">Download database</div><div className="sub">Create a local backup of the current database.</div></div><span className="spacer"/><button className="btn small" disabled={downloadDb.isPending} onClick={()=>downloadDb.mutate()}>{downloadDb.isPending?'Preparing…':'Download'}</button></div><div className="setting-row"><div><div className="lbl">Upload database</div><div className="sub exact-warning">Replaces the current database. Make a backup first.</div></div><span className="spacer"/><input ref={dbFileRef} hidden type="file" onChange={e=>{const f=e.target.files?.[0];if(f&&confirm('Replace the current database with this file?')){const form=new FormData();form.append('dbfile',f);uploadDb.mutate(form)}}}/><button className="btn danger small" disabled={uploadDb.isPending} onClick={()=>dbFileRef.current?.click()}>{uploadDb.isPending?'Uploading…':'Upload'}</button></div></div>
      </Card>
    </div>:null}

    {tab==='previous'?<Card title="Previous flight experience" subtitle="Enter totals accumulated before the first flight stored in this logbook."><div className="form-grid">{previousFields.map(([key,label])=><Field key={key} label={label} value={settings.previous_experience?.[key]??''} onChange={v=>change(`previous_experience.${key}`,v)}/>)}</div></Card>:null}

    {tab==='signature'?<SignatureEditor settings={settings} setSettings={setSettings} onSave={()=>saveSignature.mutate()}/>:null}

    {tab==='standard'?<Card title="Standard fields" subtitle="Choose the names used for the standard logbook columns." actions={<button className="btn primary small" onClick={()=>save.mutate()}>Save</button>}><div className="card rows" style={{borderRadius:10,marginBottom:14}}><SwitchRow label="Enable custom names for standard fields" sub="Override the default EASA labels." checked={Boolean(settings.enable_custom_names)} onChange={v=>change('enable_custom_names',v)}/></div><div className="form-grid">{Object.entries(standardLabels).map(([key,label])=><Field key={key} label={label} disabled={!settings.enable_custom_names} value={settings.standard_fields_headers?.[key]??label} onChange={v=>change(`standard_fields_headers.${key}`,v)}/>)}</div></Card>:null}

    {tab==='custom'?<Card title="Custom fields" subtitle="Add your own fields and decide how they appear in statistics." actions={<button className="btn primary small" onClick={()=>setField({...CUSTOM_FIELD_INITIAL_STATE})}>＋ New custom field</button>}><NativeTable rows={customFields} columns={customCols} rowKey={r=>r.uuid} loading={isCustomFieldsLoading} searchPlaceholder="Search custom fields…" /></Card>:null}

    {tab==='airports'?<Airports embedded />:null}

    <Modal open={!!field} title={field?.uuid==='new'?'New custom field':'Edit custom field'} onClose={()=>setField(null)} actions={<><button className="btn" onClick={()=>setField(null)}>Cancel</button><button className="btn primary" disabled={saveField.isPending} onClick={()=>saveField.mutate()}>Save field</button></>}>
      {field?<><div className="form-grid two"><Field label="Name" value={field.name||''} onChange={v=>setField(p=>({...p,name:v}))}/><Field label="Description" value={field.description||''} onChange={v=>setField(p=>({...p,description:v}))}/><Field label="Category" value={field.category||''} onChange={v=>setField(p=>({...p,category:v}))}/><SelectField label="Type" disabled={field.uuid!=='new'} value={field.type||'text'} onChange={v=>setField(p=>({...p,type:v,stats_function:statsByType[v]?.[0]||'none'}))} options={fieldTypes}/><SelectField label="Stats function" value={field.stats_function||'none'} onChange={v=>setField(p=>({...p,stats_function:v}))} options={statsByType[field.type]||['none']}/><Field label="Display order" type="number" value={field.display_order??0} onChange={v=>setField(p=>({...p,display_order:v}))}/></div></>:null}<Loading show={saveField.isPending}/>
    </Modal>
  </section>;
};
export default Settings;
