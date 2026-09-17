import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import SignaturePad from 'signature_pad';
import useSettings from '../../hooks/useSettings';
import useCustomFields from '../../hooks/useCustomFields';
import { useDialogs } from '../../hooks/useDialogs/useDialogs';
import { createCustomField, deleteCustomField, updateCustomField } from '../../util/http/fields';
import { updateSettings, updateSignature } from '../../util/http/settings';
import { queryClient } from '../../util/http/http';
import { deleteLogbookData, downloadDBFile, uploadDBFile } from '../../util/http/db';
import { CUSTOM_FIELD_INITIAL_STATE } from '../../constants/constants';
import { Card, Field, Loading, Modal, NativeTable, PageHead, SelectField, SwitchRow, TextArea, setNested } from '../AppleExact/Primitives';
import Airports from '../Airports/Airports';

const standardLabels={date:'Date',departure:'Departure Header',dep_place:'Place',dep_time:'Time',arrival:'Arrival Header',arr_place:'Place',arr_time:'Time',aircraft:'Aircraft Header',model:'Type',reg:'Reg',spt:'Single Pilot Header',se:'SE',me:'ME',mcc:'MCC Time',total:'Total Time',pic_name:'PIC Name',landings:'Landings',land_day:'Day',land_night:'Night',oct:'Operational Condition Time',night:'Night',ifr:'IFR',pft:'Pilot Function Time',pic:'PIC',cop:'CoPilot',dual:'Dual',instr:'Instr',fstd:'FSTD',sim_type:'Type',sim_time:'Time',remarks:'Remarks',tags:'Tags'};
const previousFields=[['total_time','Total time'],['se_time','SP SE'],['me_time','SP ME'],['mcc_time','Multi-pilot'],['night_time','Night'],['ifr_time','IFR'],['pic_time','PIC'],['co_pilot_time','Co-pilot'],['dual_time','Dual'],['instructor_time','Instructor'],['sim_time','FSTD / Sim'],['me_total_time','Total ME'],['cc_time','Cross country'],['landings_day','Day landings'],['landings_night','Night landings']];
const fieldTypes=['text','number','time','duration','enroute'];
const statsByType={text:['none','count'],number:['none','sum','average','count'],time:['none','count'],duration:['none','sum','average','count'],enroute:['none']};
const switchColors=[
  {name:'Automatic',value:'',color:'#4AD968'},
  {name:'Red',value:'#FF3B30',color:'#FF3B30'},
  {name:'Orange',value:'#FF9500',color:'#FF9500'},
  {name:'Yellow',value:'#FFCC00',color:'#FFCC00'},
  {name:'Green',value:'#4AD968',color:'#4AD968'},
  {name:'Blue',value:'#007AFF',color:'#007AFF'},
  {name:'Purple',value:'#AF52DE',color:'#AF52DE'},
  {name:'Gray',value:'#8E8E93',color:'#8E8E93'},
];

export function SwitchColorMenu({value,onChange}){
  const normalizedValue=typeof value==='string'?value.toUpperCase():'';
  const selected=switchColors.find(option=>option.value.toUpperCase()===normalizedValue)
    || (normalizedValue==='#34C759'?switchColors.find(option=>option.name==='Green'):switchColors[0]);
  return <SelectField
    className="switch-color-native-field"
    value={selected.value}
    onChange={(nextValue)=>onChange(nextValue)}
    options={switchColors.map(option=>({value:option.value,label:option.name}))}
  />;
}

function SignatureEditor({settings,onChange,onSignatureChange}){
  const canvasRef=useRef(null);const padRef=useRef(null);const fileRef=useRef(null);
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const ratio=Math.max(window.devicePixelRatio||1,1);canvas.width=canvas.offsetWidth*ratio;canvas.height=160*ratio;canvas.getContext('2d').scale(ratio,ratio);
    const pad=new SignaturePad(canvas,{penColor:settings.penColor||'#000000'});padRef.current=pad;
    if(settings.signature_image){try{pad.fromDataURL(settings.signature_image)}catch{/* ignore */}}
    const sync=()=>{if(!pad.isEmpty())onSignatureChange(pad.toDataURL())};pad.addEventListener('endStroke',sync);
    return()=>{pad.removeEventListener('endStroke',sync);pad.off()};
  },[]);
  useEffect(()=>{if(padRef.current)padRef.current.penColor=settings.penColor||'#000000'},[settings.penColor]);
  const upload=(file)=>{if(!file)return;const reader=new FileReader();reader.onload=()=>{onSignatureChange(reader.result);padRef.current?.fromDataURL(reader.result)};reader.readAsDataURL(file)};
  return <Card title="Logbook signature" subtitle="Draw or upload the signature used on signed records." actions={<><input ref={fileRef} hidden type="file" accept="image/*" onChange={e=>upload(e.target.files?.[0])}/><button className="btn small" onClick={()=>fileRef.current?.click()}>Upload</button><input aria-label="Signature color" type="color" value={settings.penColor||'#000000'} onChange={e=>onChange('penColor',e.target.value)}/><button className="btn danger small" onClick={()=>{padRef.current?.clear();onSignatureChange('')}}>Clear</button></>}><div className="signature"><canvas ref={canvasRef} style={{width:'100%',height:160,display:'block'}}/></div></Card>
}

export const Settings=()=>{
  const dialogs=useDialogs();
  const dbFileRef=useRef(null);
  const [searchParams,setSearchParams]=useSearchParams();
  const allowedTabs=['general','previous','signature','standard','custom','airports'];
  const requestedTab=searchParams.get('tab');
  const tab=allowedTabs.includes(requestedTab)?requestedTab:'general';
  const {data,isLoading}=useSettings();const {data:customFields=[],isCustomFieldsLoading}=useCustomFields();const [settings,setSettings]=useState({});const [field,setField]=useState(null);
  const settingsHydratedRef=useRef(false);
  const settingsRef=useRef({});
  const generalSaveInFlightRef=useRef(false);
  const pendingGeneralSaveRef=useRef(null);
  const lastGeneralSnapshotRef=useRef('');
  const lastSavedPasswordRef=useRef('');
  const signatureSaveInFlightRef=useRef(false);
  const pendingSignatureSaveRef=useRef(null);
  const lastSignatureSnapshotRef=useRef('');
  useEffect(()=>{
    if(data && !settingsHydratedRef.current){
      settingsHydratedRef.current=true;
      settingsRef.current=data;
      setSettings(data);
      const generalSnapshot={...data,signature_image:undefined};
      lastGeneralSnapshotRef.current=JSON.stringify(generalSnapshot);
      lastSignatureSnapshotRef.current=String(data.signature_image||'');
    }
  },[data]);
  const selectTab=useCallback((id)=>{
    if(id==='general')setSearchParams({}, {replace:true});
    else setSearchParams({tab:id}, {replace:true});
  },[setSearchParams]);

  const persistGeneral=useCallback((nextSettings)=>{
    if(!settingsHydratedRef.current)return;
    const localSnapshot={...nextSettings,signature_image:undefined};
    const serialized=JSON.stringify(localSnapshot);
    if(serialized===lastGeneralSnapshotRef.current)return;
    pendingGeneralSaveRef.current={localSnapshot,serialized};
    if(generalSaveInFlightRef.current)return;
    generalSaveInFlightRef.current=true;
    void (async()=>{
      while(pendingGeneralSaveRef.current){
        const item=pendingGeneralSaveRef.current;
        pendingGeneralSaveRef.current=null;
        const outgoing={...item.localSnapshot};
        if(outgoing.password && outgoing.password===lastSavedPasswordRef.current)outgoing.password='';
        try{
          await updateSettings({settings:outgoing});
          lastGeneralSnapshotRef.current=item.serialized;
          if(item.localSnapshot.password)lastSavedPasswordRef.current=item.localSnapshot.password;
          queryClient.setQueryData(['settings'],item.localSnapshot);
          queryClient.invalidateQueries({queryKey:['settings'],refetchType:'none'});
        }catch(error){
          console.error('Settings autosave failed',error);
        }
      }
      generalSaveInFlightRef.current=false;
      if(pendingGeneralSaveRef.current)persistGeneral(pendingGeneralSaveRef.current.localSnapshot);
    })();
  },[]);

  const persistSignature=useCallback((nextSettings)=>{
    if(!settingsHydratedRef.current)return;
    const signature=String(nextSettings.signature_image||'');
    if(signature===lastSignatureSnapshotRef.current)return;
    pendingSignatureSaveRef.current={...nextSettings,signature_image:signature};
    if(signatureSaveInFlightRef.current)return;
    signatureSaveInFlightRef.current=true;
    void (async()=>{
      while(pendingSignatureSaveRef.current){
        const item=pendingSignatureSaveRef.current;
        pendingSignatureSaveRef.current=null;
        try{
          await updateSignature({settings:item});
          lastSignatureSnapshotRef.current=String(item.signature_image||'');
          queryClient.invalidateQueries({queryKey:['settings'],refetchType:'none'});
        }catch(error){
          console.error('Signature autosave failed',error);
        }
      }
      signatureSaveInFlightRef.current=false;
      if(pendingSignatureSaveRef.current)persistSignature(pendingSignatureSaveRef.current);
    })();
  },[]);

  const change=useCallback((key,value)=>{
    const next=setNested(settingsRef.current,key,value);
    settingsRef.current=next;
    setSettings(next);
    persistGeneral(next);
  },[persistGeneral]);
  const changeSignature=useCallback((value)=>{
    const next={...settingsRef.current,signature_image:value};
    settingsRef.current=next;
    setSettings(next);
    persistSignature(next);
  },[persistSignature]);
  const changeSwitchColor=useCallback((value)=>{change('switch_color',value);if(/^#[0-9a-f]{6}$/i.test(value))document.documentElement.style.setProperty('--switch-on-color',value);else document.documentElement.style.removeProperty('--switch-on-color')},[change]);
  const downloadDb=useMutation({mutationFn:downloadDBFile,onSuccess:(blob)=>{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='web-logbook.sql';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)}});
  const uploadDb=useMutation({mutationFn:(form)=>uploadDBFile({payload:form}),onSuccess:()=>queryClient.invalidateQueries()});
  const deleteLogbook=useMutation({mutationFn:deleteLogbookData,onSuccess:async()=>{queryClient.setQueryData(['logbook'],[]);await queryClient.invalidateQueries();}});
  const saveField=useMutation({mutationFn:()=>field.uuid==='new'?createCustomField({field}):updateCustomField({field}),onSuccess:async()=>{await queryClient.invalidateQueries({queryKey:['custom-fields']});setField(null)}});
  const removeField=useMutation({mutationFn:(uuid)=>deleteCustomField({uuid}),onSuccess:()=>queryClient.invalidateQueries({queryKey:['custom-fields']})});
  const confirmDeleteField=useCallback(async(row)=>{
    const confirmed=await dialogs.confirm(`Delete ${row?.name || 'this custom field'}?`,{title:'Delete custom field',severity:'error'});
    if(confirmed)removeField.mutate(row.uuid);
  },[dialogs,removeField]);
  const customCols=useMemo(()=>[
    {key:'display_order',label:'Order'},{key:'name',label:'Name'},{key:'description',label:'Description'},{key:'category',label:'Category'},{key:'type',label:'Type'},{key:'stats_function',label:'Stats function'},
    {key:'actions',label:'',render:r=><div className="exact-actions-cell"><button className="btn small" onClick={e=>{e.stopPropagation();setField({...r})}}>Edit</button><button className="btn danger small" onClick={e=>{e.stopPropagation();confirmDeleteField(r)}}>Delete</button></div>,searchValue:()=>''}
  ],[confirmDeleteField]);
  const handleDbUpload=useCallback(async(event)=>{
    const file=event.target.files?.[0];
    event.target.value='';
    if(!file)return;
    const confirmed=await dialogs.confirm('Replace the current database with this file?',{title:'Upload database',severity:'error'});
    if(!confirmed)return;
    const form=new FormData();form.append('dbfile',file);uploadDb.mutate(form);
  },[dialogs,uploadDb]);
  const confirmDeleteLogbook=useCallback(async()=>{
    const confirmed=await dialogs.confirm('This permanently deletes all flight records and their attachments. Aircraft, persons, licences and settings are kept. Would you like to continue?',{title:'Delete logbook data',severity:'error'});
    if(confirmed)deleteLogbook.mutate();
  },[dialogs,deleteLogbook]);
  const tabs=[['general','General'],['previous','Previous flight experience'],['signature','Logbook signature'],['standard','Standard fields'],['custom','Custom fields'],['airports','Airports']];
  return <section className="exact-react-page">
    <PageHead title="Settings" subtitle="Configure your logbook, fields, signature, airports and previous experience." />
    <Loading show={isLoading}/>
    <div className="settings-tabs">{tabs.map(([id,label])=><button key={id} className={tab===id?'on':''} onClick={()=>selectTab(id)}>{label}</button>)}</div>

    {tab==='general'?<div className="grid two">
      <Card title="General settings" subtitle="Owner information, application options and authentication.">
        <div className="section-label">Owner information</div><div className="form-grid two"><Field label="Owner name" value={settings.owner_name||''} onChange={v=>change('owner_name',v)}/><Field label="Licence number" value={settings.license_number||''} onChange={v=>change('license_number',v)}/><Field label="Address" value={settings.address||''} onChange={v=>change('address',v)}/><Field label="Signature text" value={settings.signature_text||''} onChange={v=>change('signature_text',v)}/></div>
        <div className="section-label" style={{marginTop:15}}>Logbook</div><div className="form-grid two"><Field label="Logbook pagination" value={settings.logbook_pagination||''} onChange={v=>change('logbook_pagination',v)}/><Field label="Self PIC label" value={settings.self_pic_label||'Self'} onChange={v=>change('self_pic_label',v)}/><Field label="Expiry warning period (days)" type="number" value={settings.licenses_expiration?.warning_period||90} onChange={v=>change('licenses_expiration.warning_period',v)}/></div>
        <div className="card rows" style={{borderRadius:10,marginTop:12}}><SwitchRow label="Show licence warning" checked={Boolean(settings.licenses_expiration?.show_warning)} onChange={v=>change('licenses_expiration.show_warning',v)}/><SwitchRow label="Show expired licences" checked={Boolean(settings.licenses_expiration?.show_expired)} onChange={v=>change('licenses_expiration.show_expired',v)}/></div>
        <div className="section-label" style={{marginTop:15}}>Appearance</div>
        <div className="card rows" style={{borderRadius:10}}>
          <SwitchRow label="Show menu icons" sub="Show or hide the icons in the left sidebar." checked={!Boolean(settings.hide_menu_icons)} onChange={v=>change('hide_menu_icons',!v)}/>
          <div className="setting-row">
            <div><div className="lbl">On / Off switch color</div><div className="sub">Choose the color used when switches are enabled across the app.</div></div>
            <span className="spacer"/>
            <SwitchColorMenu value={settings.switch_color} onChange={changeSwitchColor}/>
          </div>
        </div>
      </Card>
      <Card title="Security & database" subtitle="Authentication, formatting and database operations.">
        <div className="card rows" style={{borderRadius:10}}><SwitchRow label="Enable authentication" checked={Boolean(settings.auth_enabled)} onChange={v=>{change('auth_enabled',v);if(v&&!settings.secret_key){const a=new Uint8Array(32);crypto.getRandomValues(a);change('secret_key',btoa(String.fromCharCode.apply(null,a)))}}}/></div>
        <div className="form-grid two" style={{marginTop:12}}><Field label="Login" value={settings.login||''} disabled={!settings.auth_enabled} onChange={v=>change('login',v)}/><Field label="Password" type="password" value={settings.password||''} disabled={!settings.auth_enabled} onChange={v=>change('password',v)}/><Field label="Secret key" value={settings.secret_key||''} disabled={!settings.auth_enabled} onChange={v=>change('secret_key',v)}/><SelectField label="Time fields autoformat" value={String(settings.time_fields_auto_format??0)} onChange={v=>change('time_fields_auto_format',Number(v))} options={[{value:'0',label:'None'},{value:'1',label:'HH:MM'},{value:'2',label:'H:MM'}]}/><SelectField label="Logbook totals view" value={String(settings.logbook_totals_view??0)} onChange={v=>change('logbook_totals_view',Number(v))} options={[{value:'0',label:'Standard'},{value:'1',label:'Paper Logbook'}]}/></div>
        <div className="section-label" style={{marginTop:15}}>Data</div>
        <div className="card rows" style={{borderRadius:10}}><div className="setting-row"><div><div className="lbl">Download database</div><div className="sub">Create a local backup of the current database.</div></div><span className="spacer"/><button className="btn small" disabled={downloadDb.isPending} onClick={()=>downloadDb.mutate()}>{downloadDb.isPending?'Preparing…':'Download'}</button></div><div className="setting-row"><div><div className="lbl">Upload database</div><div className="sub exact-warning">Replaces the current database. Make a backup first.</div></div><span className="spacer"/><input ref={dbFileRef} hidden type="file" onChange={handleDbUpload}/><button className="btn danger small" disabled={uploadDb.isPending} onClick={()=>dbFileRef.current?.click()}>{uploadDb.isPending?'Uploading…':'Upload'}</button></div><div className="setting-row"><div><div className="lbl">Delete logbook data</div><div className="sub exact-warning">Permanently deletes all flight records and their attachments. Settings, aircraft, persons and licences are kept.</div></div><span className="spacer"/><button className="btn danger small" disabled={deleteLogbook.isPending} onClick={confirmDeleteLogbook}>{deleteLogbook.isPending?'Deleting…':'Delete'}</button></div></div>
      </Card>
    </div>:null}

    {tab==='previous'?<Card title="Previous flight experience" subtitle="Enter totals accumulated before the first flight stored in this logbook."><div className="form-grid">{previousFields.map(([key,label])=><Field key={key} label={label} value={settings.previous_experience?.[key]??''} onChange={v=>change(`previous_experience.${key}`,v)}/>)}</div></Card>:null}

    {tab==='signature'?<SignatureEditor settings={settings} onChange={change} onSignatureChange={changeSignature}/>:null}

    {tab==='standard'?<Card title="Standard fields" subtitle="Choose the names used for the standard logbook columns."><div className="card rows" style={{borderRadius:10,marginBottom:14}}><SwitchRow label="Enable custom names for standard fields" sub="Override the default EASA labels." checked={Boolean(settings.enable_custom_names)} onChange={v=>change('enable_custom_names',v)}/></div><div className="form-grid">{Object.entries(standardLabels).map(([key,label])=><Field key={key} label={label} disabled={!settings.enable_custom_names} value={settings.standard_fields_headers?.[key]??label} onChange={v=>change(`standard_fields_headers.${key}`,v)}/>)}</div></Card>:null}

    {tab==='custom'?<Card title="Custom fields" subtitle="Add your own fields and decide how they appear in statistics." actions={<button className="btn primary small" onClick={()=>setField({...CUSTOM_FIELD_INITIAL_STATE})}>＋ New custom field</button>}><NativeTable rows={customFields} columns={customCols} rowKey={r=>r.uuid} loading={isCustomFieldsLoading} searchPlaceholder="Search custom fields…" /></Card>:null}

    {tab==='airports'?<Airports embedded />:null}

    <Modal open={!!field} title={field?.uuid==='new'?'New custom field':'Edit custom field'} onClose={()=>setField(null)} actions={<><button className="btn" onClick={()=>setField(null)}>Back</button><button className="btn primary" disabled={saveField.isPending} onClick={()=>saveField.mutate()}>Save field</button></>}>
      {field?<><div className="form-grid two"><Field label="Name" value={field.name||''} onChange={v=>setField(p=>({...p,name:v}))}/><Field label="Description" value={field.description||''} onChange={v=>setField(p=>({...p,description:v}))}/><Field label="Category" value={field.category||''} onChange={v=>setField(p=>({...p,category:v}))}/><SelectField label="Type" disabled={field.uuid!=='new'} value={field.type||'text'} onChange={v=>setField(p=>({...p,type:v,stats_function:statsByType[v]?.[0]||'none'}))} options={fieldTypes}/><SelectField label="Stats function" value={field.stats_function||'none'} onChange={v=>setField(p=>({...p,stats_function:v}))} options={statsByType[field.type]||['none']}/><Field label="Display order" type="number" value={field.display_order??0} onChange={v=>setField(p=>({...p,display_order:v}))}/></div></>:null}<Loading show={saveField.isPending}/>
    </Modal>
  </section>;
};
export default Settings;
