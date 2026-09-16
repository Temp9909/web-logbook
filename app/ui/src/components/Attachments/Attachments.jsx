import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { deleteAttachment, downloadAttachments, fetchAttachment, fetchAttachments } from '../../util/http/attachment';
import { resetTrackLog } from '../../util/http/logbook';
import { queryClient } from '../../util/http/http';
import AttachmentPreview from './AttachmentPreview';
import { Card, Chip, EmptyState, Loading, PageHead, Search } from '../AppleExact/Primitives';

const extensionOf=(name='')=>String(name).split('.').pop()?.toLowerCase()||'';
const downloadBlob=(blob,name)=>{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name||'attachment';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)};
const documentBlob=(payload)=>{const binary=atob(payload?.document||'');const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i+=1)bytes[i]=binary.charCodeAt(i);return new Blob([bytes],{type:'application/octet-stream'})};

export const Attachments=()=>{
  const navigate=useNavigate();
  const [query,setQuery]=useState('');
  const [selectedId,setSelectedId]=useState('');
  const {data:rawData,isLoading}=useQuery({queryKey:['attachments'],queryFn:({signal})=>fetchAttachments({signal}),staleTime:3600000});
  const list=useMemo(()=>Array.isArray(rawData)?rawData.filter(Boolean):[],[rawData]);
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

  const handleDelete=(row)=>{
    if(!row?.uuid)return;
    if(!confirm(`Delete ${row.document_name || 'this attachment'}?`))return;
    const isTrack=extensionOf(row.document_name)==='kml';
    const resetTrack=isTrack ? confirm('This KML looks like a track log. Reset the flight track and distance too?') : false;
    remove.mutate({row,resetTrack});
  };

  return <section className="exact-react-page">
    <PageHead
      title="Attachments"
      subtitle="Browse, preview, download and remove documents attached to flight records."
      actions={<button className="btn ghost" disabled={!filtered.length||downloadAll.isPending} onClick={()=>confirm(`Download ${filtered.length} displayed attachment${filtered.length===1?'':'s'}?`)&&downloadAll.mutate(filtered)}>{downloadAll.isPending?'Preparing…':`Download displayed (${filtered.length})`}</button>}
    />
    <div className="note exact-attachment-note">New attachments are added from the relevant flight record so every file stays linked to the correct flight.</div>
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
  </section>;
};
export default Attachments;
