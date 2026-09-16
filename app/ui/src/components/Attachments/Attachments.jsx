import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { deleteAttachment, downloadAttachments, fetchAttachments } from '../../util/http/attachment';
import { queryClient } from '../../util/http/http';
import AttachmentPreview from './AttachmentPreview';
import { Card, Chip, Loading, NativeTable, PageHead } from '../AppleExact/Primitives';

const downloadBlob=(blob,name)=>{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)};

export const Attachments=()=>{
  const [selected,setSelected]=useState({});
  const {data=[],isLoading}=useQuery({queryKey:['attachments'],queryFn:({signal})=>fetchAttachments({signal}),staleTime:3600000});
  const downloadAll=useMutation({mutationFn:()=>downloadAttachments({payload:{ids:(Array.isArray(data)?data:[]).map(r=>r.uuid)}}),onSuccess:(blob)=>downloadBlob(blob,'attachments.zip')});
  const remove=useMutation({mutationFn:(id)=>deleteAttachment({id}),onSuccess:async()=>{await queryClient.invalidateQueries({queryKey:['attachments']});setSelected({});}});
  const cols=useMemo(()=>[
    {key:'flight_date',label:'Flight date'},
    {key:'flight_info',label:'Flight info'},
    {key:'document_name',label:'Document name'},
    {key:'document_type',label:'Type',render:r=><Chip>{String(r.document_name||'').split('.').pop()?.toUpperCase()||'FILE'}</Chip>,searchValue:r=>r.document_name},
    {key:'document_size',label:'Size',render:r=>r.document_size?`${r.document_size} KB`:'—'},
    {key:'actions',label:'',render:r=><button className="btn danger small" onClick={(e)=>{e.stopPropagation();if(confirm('Delete this attachment?'))remove.mutate(r.uuid)}}>Delete</button>,searchValue:()=>''}
  ],[remove]);
  return <section className="exact-react-page">
    <PageHead title="Attachments" subtitle="Browse and manage documents attached to your logbook." actions={<button className="btn ghost" disabled={!data?.length||downloadAll.isPending} onClick={()=>confirm(`Download ${data.length} attachments?`)&&downloadAll.mutate()}>{downloadAll.isPending?'Preparing…':'Download all'}</button>} />
    <Loading show={isLoading||downloadAll.isPending}/>
    <div className="split">
      <Card title="Documents" subtitle="Select an attachment to preview it."><NativeTable rows={data} columns={cols} rowKey={r=>r.uuid} loading={isLoading} searchPlaceholder="Search attachments…" onRowClick={setSelected}/></Card>
      <div className="exact-document-preview"><AttachmentPreview attachment={selected}/></div>
    </div>
  </section>;
};
export default Attachments;
