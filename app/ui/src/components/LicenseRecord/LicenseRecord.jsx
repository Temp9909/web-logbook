import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { LICENSE_INITIAL_STATE } from '../../constants/constants';
import { createLicenseRecord, deleteLicenseRecord, fetchLicense, fetchLicenseCategory, updateLicenseRecord } from '../../util/http/licensing';
import { queryClient } from '../../util/http/http';
import { Card, Field, Loading, PageHead, SelectField, TextArea, fromInputDate, toInputDate } from '../AppleExact/Primitives';

export const LicenseRecord = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [license, setLicense] = useState({ ...LICENSE_INITIAL_STATE, uuid: id });

  const { data, isLoading } = useQuery({ queryKey:['license',id], queryFn:({signal})=>fetchLicense({signal,id}), enabled:id !== 'new' });
  const { data: categories = [] } = useQuery({ queryKey:['license-categories'], queryFn:({signal})=>fetchLicenseCategory({signal}) });
  useEffect(() => { if (data) setLicense(data); }, [data]);
  const change = useCallback((key,value)=>setLicense(prev=>({...prev,[key]:value})),[]);

  const save = useMutation({
    mutationFn: async () => {
      if (!license.category || !license.name) throw new Error('Category and name are required.');
      const form = new FormData();
      ['uuid','number','name','issued','valid_from','category','valid_until','document_name','remarks'].forEach((key)=>form.append(key, license[key] ?? ''));
      if (license.document instanceof File) form.append('document', license.document);
      else if (license.document) form.append('document', license.document);
      return license.uuid === 'new' ? createLicenseRecord({ payload: form }) : updateLicenseRecord({ uuid: license.uuid, payload: form });
    },
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({queryKey:['licensing']});
      if (license.uuid === 'new') {
        try { const payload = JSON.parse(await response.text()); if (payload?.data) navigate(`/licensing/${payload.data}`, {replace:true}); }
        catch { navigate('/licensing'); }
      }
    }
  });
  const remove = useMutation({ mutationFn:()=>deleteLicenseRecord({id:license.uuid}), onSuccess:async()=>{await queryClient.invalidateQueries({queryKey:['licensing']});navigate('/licensing');} });

  const categoryOptions = (Array.isArray(categories) ? categories : []).map((c)=>typeof c === 'string' ? c : c?.name || c?.category).filter(Boolean);
  if (license.category && !categoryOptions.includes(license.category)) categoryOptions.unshift(license.category);

  return <section className="exact-react-page">
    <PageHead title={id === 'new' ? 'Add a rating' : 'Rating details'} subtitle={id === 'new' ? 'Add a licence, rating or certification record.' : 'Review and update this licensing record.'} actions={<><button className="btn ghost" onClick={()=>navigate('/licensing')}>Cancel</button>{id !== 'new' ? <button className="btn danger" onClick={()=>confirm('Delete this licensing record?') && remove.mutate()}>Delete</button>:null}<button className="btn primary" disabled={save.isPending} onClick={()=>save.mutate()}>{save.isPending?'Saving…':'Save rating'}</button></>} />
    <Loading show={isLoading || save.isPending || remove.isPending}/>
    {save.error ? <div className="note exact-inline-danger">{String(save.error.message || save.error)}</div> : null}
    <div className="split">
      <Card title="License & certification record" subtitle="Enter the rating details and validity dates.">
        <div className="form-grid two">
          <SelectField label="Category" value={license.category || ''} onChange={(v)=>change('category',v)} options={categoryOptions.length ? categoryOptions : ['Licence','Rating','Medical','Certificate']} />
          <Field label="Name" value={license.name || ''} onChange={(v)=>change('name',v)} />
          <Field label="Number / reference" value={license.number || ''} onChange={(v)=>change('number',v)} />
          <Field label="Issued" type="date" value={toInputDate(license.issued)} onChange={(v)=>change('issued',fromInputDate(v))} />
          <Field label="Valid from" type="date" value={toInputDate(license.valid_from)} onChange={(v)=>change('valid_from',fromInputDate(v))} />
          <Field label="Valid until" type="date" value={toInputDate(license.valid_until)} onChange={(v)=>change('valid_until',fromInputDate(v))} />
          <label className="field"><span>Attachment</span><input className="input" type="file" onChange={(e)=>{const file=e.target.files?.[0];if(file){change('document',file);change('document_name',file.name);}}}/></label>
          <Field label="Document name" value={license.document_name || ''} onChange={(v)=>change('document_name',v)} readOnly={license.document instanceof File} />
        </div>
        <div style={{marginTop:11}}><TextArea label="Notes" value={license.remarks || ''} onChange={(v)=>change('remarks',v)} /></div>
      </Card>
      <Card title="Preview" subtitle="Summary of the licensing record.">
        <div className="exact-preview-sheet" style={{minHeight:360}}>
          <div className="muted" style={{fontSize:11,textTransform:'uppercase',letterSpacing:'.08em'}}>Licensing record</div>
          <h2 style={{fontSize:28,margin:'8px 0 2px'}}>{license.name || 'New rating'}</h2>
          <div className="muted">{license.category || 'Category'}</div>
          <div style={{height:42}}/>
          <div className="exact-panel-section"><strong>Reference</strong><div>{license.number || '—'}</div></div>
          <div className="exact-panel-section"><strong>Validity</strong><div>{license.valid_from || '—'} → {license.valid_until || '—'}</div></div>
          <div className="exact-panel-section"><strong>Attachment</strong><div>{license.document_name || 'No document'}</div></div>
          {license.remarks ? <div className="exact-panel-section"><strong>Notes</strong><div>{license.remarks}</div></div> : null}
        </div>
      </Card>
    </div>
  </section>;
};
export default LicenseRecord;
