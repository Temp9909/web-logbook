import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { deleteAttachment, downloadAttachments, fetchAttachment, fetchAttachments, uploadAttachement } from '../../util/http/attachment';
import { fetchLogbookData, resetTrackLog } from '../../util/http/logbook';
import { queryClient } from '../../util/http/http';
import { useDialogs } from '../../hooks/useDialogs/useDialogs';
import AttachmentPreview from './AttachmentPreview';
import { Card, Chip, EmptyState, Loading, Modal, PageHead, Search, SelectField } from '../AppleExact/Primitives';

const extensionOf=(name='')=>String(name).split('.').pop()?.toLowerCase()||'';
const downloadBlob=(blob,name)=>{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name||'attachment';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)};
const documentBlob=(payload)=>{const binary=atob(payload?.document||'');const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i+=1)bytes[i]=binary.charCodeAt(i);return new Blob([bytes],{type:'application/octet-stream'})};
const flightLabel=(flight)=>{
  const route=[flight?.departure?.place,flight?.arrival?.place].filter(Boolean).join(' → ');
  const aircraft=[flight?.aircraft?.reg_name,flight?.aircraft?.model].filter(Boolean).join(' · ');
  return [flight?.date,route,aircraft].filter(Boolean).join(' · ') || flight?.uuid || 'Flight';
};

export const Attachments=()=>{
  const navigate=useNavigate();
  const dialogs=useDialogs();
  const fileInputRef=useRef(null);
  const folderInputRef=useRef(null);
  const [query,setQuery]=useState('');
  const [selectedId,setSelectedId]=useState('');
  const [addOpen,setAddOpen]=useState(false);
  const [targetFlightId,setTargetFlightId]=useState('');
  const {data:rawData,isLoading}=useQuery({queryKey:['attachments'],queryFn:({signal})=>fetchAttachments({signal}),staleTime:3600000});
  const {data:rawFlights=[],isLoading:loadingFlights}=useQuery({queryKey:['logbook'],queryFn:({signal})=>fetchLogbookData({signal}),staleTime:3600000,gcTime:3600000});
  const list=useMemo(()=>Array.isArray(rawData)?rawData.filter(Boolean):[],[rawData]);
  const flights=useMemo(()=>Array.isArray(rawFlights)?rawFlights.filter((flight)=>flight?.uuid && flight.uuid!=='previous-experience-artificial-uuid'):[],[rawFlights]);
  const flightOptions=useMemo(()=>[
    {value:'',label:'Choose a flight…'},
    ...flights.map((flight)=>({value:flight.uuid,label:flightLabel(flight)})),
  ],[flights]);
  const filtered=useMemo(()=>{
    const q=query.trim().toLowerCase();
    if(!q)return list;
    return list.filter(r=>[r?.flight_date,r?.flight_info,r?.document_name].some(v=>String(v??'').toLowerCase().includes(q)));
  },[list,query]);
  const selected=useMemo(()=>list.find(r=>r?.uuid===selectedId)||null,[list,selectedId]);

  useEffect(()=>{
    const preferred=filtered[0]?.uuid || list[0]?.uuid || '';
    if(!selectedId && preferred)setSelectedId(preferred);
    else if(selectedId && !filtered.some(r=>r?.uuid===selectedId))setSelectedId(preferred);
  },[filtered,list,selectedId]);

  const upload=useMutation({
    mutationFn:async({files,flightId})=>{
      const selectedFiles=Array.from(files||[]).filter(Boolean);
      for(const file of selectedFiles){
        const formData=new FormData();
        formData.append('document',file,file.name);
        formData.append('id',flightId);
        await uploadAttachement({payload:formData});
      }
      return {count:selectedFiles.length,flightId};
    },
    onSuccess:async({flightId})=>{
      await Promise.all([
        queryClient.invalidateQueries({queryKey:['attachments']}),
        queryClient.invalidateQueries({queryKey:['logbook']}),
        queryClient.invalidateQueries({queryKey:['flight',flightId]}),
      ]);
      setAddOpen(false);
      setTargetFlightId('');
    },
  });
  const downloadAll=useMutation({
    mutationFn:(rows)=>downloadAttachments({payload:{ids:rows.map(r=>r.uuid)}}),
    onSuccess:(blob)=>downloadBlob(blob,'attachments.zip'),
  });
  const downloadOne=useMutation({
    mutationFn:(row)=>fetchAttachment({id:row.uuid}),
    onSuccess:(payload,row)=>downloadBlob(documentBlob(payload),payload?.document_name||row?.document_name||'attachment'),
  });
  const remove=useMutation({
    mutationFn:async({row,resetTrack})=>{
      if(resetTrack && row?.record_id)await resetTrackLog({id:row.record_id});
      await deleteAttachment({id:row.uuid});
      return row;
    },
    onSuccess:async(row)=>{
      await queryClient.invalidateQueries({queryKey:['attachments']});
      if(row?.record_id){
        await queryClient.invalidateQueries({queryKey:['flight',row.record_id]});
        await queryClient.invalidateQueries({queryKey:['logbook']});
      }
    },
  });

  const handleDelete=async(row)=>{
    if(!row?.uuid)return;
    const confirmed=await dialogs.confirm(`Delete ${row.document_name || 'this attachment'}?`,{title:'Delete attachment',severity:'error'});
    if(!confirmed)return;
    const isTrack=extensionOf(row.document_name)==='kml';
    const resetTrack=isTrack ? await dialogs.confirm('This KML looks like a track log. Reset the flight track and distance too?',{title:'Reset track',okText:'Done',cancelText:'Back',severity:'warning'}) : false;
    remove.mutate({row,resetTrack});
  };
  const handleDownloadDisplayed=async()=>{
    if(!filtered.length||downloadAll.isPending)return;
    const confirmed=await dialogs.confirm(`Download ${filtered.length} displayed attachment${filtered.length===1?'':'s'}?`,{title:'Download attachments',okText:'Done',cancelText:'Back'});
    if(confirmed)downloadAll.mutate(filtered);
  };

  const handleUploadSelection=(event)=>{
    const files=event.target.files;
    if(files?.length && targetFlightId)upload.mutate({files,flightId:targetFlightId});
    event.target.value='';
  };

  return <section className="exact-react-page">
    <PageHead
      title="Attachments"
      subtitle="Browse, preview, add, download and remove documents attached to flight records."
      actions={<>
        <button className="btn primary" onClick={()=>setAddOpen(true)}>＋ Add files / folder</button>
        <button className="btn ghost" disabled={!filtered.length||downloadAll.isPending} onClick={handleDownloadDisplayed}>{downloadAll.isPending?'Preparing…':`Download displayed (${filtered.length})`}</button>
      </>}
    />
    <div className="note exact-attachment-note">Files added here are linked to the flight you choose. “Add folder” imports every file contained in the selected folder.</div>
    <Loading show={isLoading||downloadAll.isPending}/>
    <div className="split exact-attachments-split">
      <Card title="Documents" subtitle={`${filtered.length} attachment${filtered.length===1?'':'s'} displayed.`}>
        <div className="toolbar exact-table-toolbar"><Search value={query} onChange={setQuery} placeholder="Search file, date or flight…" /></div>
        <div className="table-wrap exact-native-table-wrap exact-attachments-table-wrap">
          <table>
            <thead><tr><th>Flight date</th><th>Flight</th><th>Document</th><th>Type</th><th>Size</th><th></th></tr></thead>
            <tbody>
              {!isLoading && filtered.map(row=>{
                const ext=extensionOf(row?.document_name);
                const active=selectedId===row?.uuid;
                return <tr key={row?.uuid} className={`clickable${active?' exact-selected-row':''}`} onClick={()=>setSelectedId(row.uuid)}>
                  <td>{row?.flight_date||'—'}</td>
                  <td><button className="exact-inline-link" onClick={e=>{e.stopPropagation();row?.record_id&&navigate(`/logbook/${row.record_id}`)}}>{row?.flight_info||'Open flight'}</button></td>
                  <td className="exact-attachment-name">{row?.document_name||'Unnamed file'}</td>
                  <td><Chip>{ext?ext.toUpperCase():'FILE'}</Chip></td>
                  <td>{Number.isFinite(Number(row?.document_size))?`${row.document_size} KB`:'—'}</td>
                  <td><div className="exact-actions-cell">
                    <button className="btn small" disabled={downloadOne.isPending} onClick={e=>{e.stopPropagation();downloadOne.mutate(row)}}>Download</button>
                    <button className="btn danger small" disabled={remove.isPending} onClick={e=>{e.stopPropagation();handleDelete(row)}}>Delete</button>
                  </div></td>
                </tr>;
              })}
              {!isLoading && !filtered.length ? <tr><td colSpan="6"><EmptyState>No attachments found</EmptyState></td></tr> : null}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="exact-document-preview"><AttachmentPreview attachment={selected}/></div>
    </div>

    <Modal open={addOpen} title="Add attachments" onClose={()=>!upload.isPending&&setAddOpen(false)} actions={<button className="btn" disabled={upload.isPending} onClick={()=>setAddOpen(false)}>Close</button>}>
      <div className="exact-attachment-upload-modal">
        <SelectField label="Attach to flight" value={targetFlightId} onChange={setTargetFlightId} options={flightOptions} disabled={loadingFlights||upload.isPending}/>
        <div className="note">Choose the flight first, then add one or more files or import an entire folder.</div>
        <div className="grid two exact-upload-choice-grid">
          <button className="card exact-upload-choice" type="button" disabled={!targetFlightId||upload.isPending} onClick={()=>fileInputRef.current?.click()}>
            <strong>＋ Add files</strong><span>Select one or more documents.</span>
          </button>
          <button className="card exact-upload-choice" type="button" disabled={!targetFlightId||upload.isPending} onClick={()=>folderInputRef.current?.click()}>
            <strong>＋ Add folder</strong><span>Import every file inside a folder.</span>
          </button>
        </div>
        <input ref={fileInputRef} hidden type="file" multiple onChange={handleUploadSelection}/>
        <input ref={folderInputRef} hidden type="file" multiple webkitdirectory="" directory="" onChange={handleUploadSelection}/>
        {upload.isPending ? <div className="note">Uploading files…</div> : null}
        {upload.isError ? <div className="note exact-error-note">Upload failed: {upload.error?.info?.message || upload.error?.message || 'Unknown error'}</div> : null}
      </div>
    </Modal>
  </section>;
};
export default Attachments;
