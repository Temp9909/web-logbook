import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAttachment } from '../../util/http/attachment';
import { Card, EmptyState, Loading } from '../AppleExact/Primitives';

const MIME_BY_EXT = {
  pdf:'application/pdf', png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', gif:'image/gif', webp:'image/webp', bmp:'image/bmp', svg:'image/svg+xml',
  txt:'text/plain', csv:'text/csv', json:'application/json', xml:'text/xml', log:'text/plain',
};
const TEXT_EXT = new Set(['txt','csv','json','xml','log']);

const extensionOf = (name='') => String(name).split('.').pop()?.toLowerCase() || '';

function decodeBase64(document='') {
  const binary = atob(document || '');
  const bytes = new Uint8Array(binary.length);
  for (let i=0;i<binary.length;i+=1) bytes[i]=binary.charCodeAt(i);
  return bytes;
}

export const AttachmentPreview = ({ attachment }) => {
  const [blobUrl,setBlobUrl]=useState('');
  const [textPreview,setTextPreview]=useState('');
  const ext=extensionOf(attachment?.document_name);
  const mime=MIME_BY_EXT[ext] || 'application/octet-stream';

  const {data,isLoading,isError}=useQuery({
    queryKey:['attachments','attachment',attachment?.uuid],
    queryFn:()=>fetchAttachment({id:attachment.uuid}),
    staleTime:3600000,
    gcTime:3600000,
    refetchOnWindowFocus:false,
    enabled:Boolean(attachment?.uuid),
  });

  useEffect(()=>{
    setTextPreview('');
    setBlobUrl((current)=>{if(current)URL.revokeObjectURL(current);return '';});
    if(!data?.document)return undefined;
    try{
      const bytes=decodeBase64(data.document);
      if(TEXT_EXT.has(ext)){
        setTextPreview(new TextDecoder('utf-8').decode(bytes));
        return undefined;
      }
      const url=URL.createObjectURL(new Blob([bytes],{type:mime}));
      setBlobUrl(url);
      return ()=>URL.revokeObjectURL(url);
    }catch{
      return undefined;
    }
  },[data,ext,mime]);

  const subtitle=useMemo(()=>{
    if(!attachment?.uuid)return 'Select a document from the list.';
    return [attachment.flight_date,attachment.flight_info].filter(Boolean).join(' · ') || 'Logbook attachment';
  },[attachment]);

  let body=null;
  if(!attachment?.uuid) body=<EmptyState>No attachment selected</EmptyState>;
  else if(isLoading) body=<Loading/>;
  else if(isError || !data?.document) body=<EmptyState>Unable to load this attachment.</EmptyState>;
  else if(mime.startsWith('image/') && blobUrl) body=<img className="exact-attachment-image" src={blobUrl} alt={attachment.document_name || 'Attachment'} />;
  else if(mime==='application/pdf' && blobUrl) body=<iframe className="exact-attachment-frame" src={blobUrl} title={attachment.document_name || 'PDF attachment'} />;
  else if(TEXT_EXT.has(ext)) body=<pre className="exact-attachment-text">{textPreview || 'Empty file'}</pre>;
  else body=<div className="exact-attachment-generic"><div className="exact-file-badge">{ext ? ext.toUpperCase() : 'FILE'}</div><strong>{attachment.document_name || 'Attachment'}</strong><span>Preview is not available for this file type. Use Download to open the original file.</span></div>;

  return <Card title={attachment?.document_name || 'Attachment preview'} subtitle={subtitle} className="exact-attachment-preview-card">{body}</Card>;
};

export default AttachmentPreview;
