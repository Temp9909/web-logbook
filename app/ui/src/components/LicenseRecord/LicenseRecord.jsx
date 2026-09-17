import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { LICENSE_INITIAL_STATE } from '../../constants/constants';
import { createLicenseRecord, deleteLicenseRecord, fetchLicense, fetchLicenseCategory, updateLicenseRecord } from '../../util/http/licensing';
import { queryClient } from '../../util/http/http';
import { useDialogs } from '../../hooks/useDialogs/useDialogs';
import { Card, Field, Loading, PageHead, SelectField, TextArea, fromInputDate, toInputDate } from '../AppleExact/Primitives';
import { EASA_LICENSE_CATEGORIES, namesForLicenseCategory } from './easaLicenseOptions';
import { calculateRegulatoryValidUntil, normalizeValidity, validityRuleFor } from './easaValidityRules';

const CUSTOM_NAME_VALUE = '__custom_name__';

export const LicenseRecord = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dialogs = useDialogs();
  const [license, setLicense] = useState({ ...LICENSE_INITIAL_STATE, uuid: id });
  const [customNameMode, setCustomNameMode] = useState(false);

  const { data, isLoading } = useQuery({ queryKey:['license',id], queryFn:({signal})=>fetchLicense({signal,id}), enabled:id !== 'new' });
  const { data: categories = [] } = useQuery({ queryKey:['license-categories'], queryFn:({signal})=>fetchLicenseCategory({signal}) });
  useEffect(() => {
    if (!data) return;
    setLicense(data);
    const prescribedNames = namesForLicenseCategory(data.category);
    setCustomNameMode(Boolean(data.name) && !prescribedNames.includes(data.name));
  }, [data]);
  const change = useCallback((key,value)=>setLicense(prev=>({...prev,[key]:value})),[]);

  const save = useMutation({
    mutationFn: async () => {
      if (!license.category || !license.name) throw new Error('Category and name are required.');
      const normalizedValidity = normalizeValidity(license);
      const recordToSave = { ...license, ...normalizedValidity };
      const form = new FormData();
      ['uuid','number','name','issued','valid_from','category','valid_until','document_name','remarks'].forEach((key)=>form.append(key, recordToSave[key] ?? ''));
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

  const storedCategories = (Array.isArray(categories) ? categories : []).map((c)=>typeof c === 'string' ? c : c?.name || c?.category).filter(Boolean);
  const categoryOptions = [...new Set([...EASA_LICENSE_CATEGORIES, ...storedCategories])];
  if (license.category && !categoryOptions.includes(license.category)) categoryOptions.push(license.category);
  const prescribedNames = namesForLicenseCategory(license.category);
  const selectedNameIsCustom = customNameMode || (Boolean(license.name) && !prescribedNames.includes(license.name));
  const validityRule = validityRuleFor(license.category, license.name);
  const showValidityDates = validityRule.kind !== 'none';
  const autoValidity = validityRule.kind === 'fixed';
  const nameOptions = [
    {value:'',label:license.category ? 'Select a name…' : 'Select a category first…'},
    ...prescribedNames,
    {value:CUSTOM_NAME_VALUE,label:'Other / custom…'},
  ];

  const changeCategory = (category) => {
    const nextNames = namesForLicenseCategory(category);
    const nextName = nextNames[0] || '';
    setCustomNameMode(nextNames.length === 0);
    setLicense((current) => {
      const rule = validityRuleFor(category, nextName);
      const next = { ...current, category, name: nextName };
      if (rule.kind === 'none') return { ...next, valid_from: '', valid_until: '' };
      if (rule.kind === 'fixed') return { ...next, valid_until: calculateRegulatoryValidUntil(current.valid_from, rule) };
      return next;
    });
  };

  const changeName = (name) => {
    if (name === CUSTOM_NAME_VALUE) {
      setCustomNameMode(true);
      change('name','');
      return;
    }
    setCustomNameMode(false);
    setLicense((current) => {
      const rule = validityRuleFor(current.category, name);
      const next = { ...current, name };
      if (rule.kind === 'none') return { ...next, valid_from: '', valid_until: '' };
      if (rule.kind === 'fixed') return { ...next, valid_until: calculateRegulatoryValidUntil(current.valid_from, rule) };
      return next;
    });
  };

  const changeValidFrom = (validFrom) => {
    setLicense((current) => {
      const rule = validityRuleFor(current.category, current.name);
      if (rule.kind === 'none') return { ...current, valid_from: '', valid_until: '' };
      if (rule.kind === 'fixed') {
        return { ...current, valid_from: validFrom, valid_until: calculateRegulatoryValidUntil(validFrom, rule) };
      }
      return { ...current, valid_from: validFrom };
    });
  };

  const handleDelete=async()=>{
    const confirmed=await dialogs.confirm('Delete this licensing record?',{title:'Delete licensing record',severity:'error'});
    if(confirmed)remove.mutate();
  };

  return <section className="exact-react-page">
    <PageHead title={id === 'new' ? 'Add a licensing record' : 'Licensing record'} subtitle={id === 'new' ? 'Add a licence, rating, medical or certification record.' : 'Review and update this licensing record.'} actions={<><button className="btn ghost" onClick={()=>navigate('/licensing')}>Back</button>{id !== 'new' ? <button className="btn danger" onClick={handleDelete}>Delete</button>:null}<button className="btn primary" disabled={save.isPending} onClick={()=>save.mutate()}>{save.isPending?'Saving…':(id === 'new' ? 'Done' : 'Save record')}</button></>} />
    <Loading show={isLoading || save.isPending || remove.isPending}/>
    {save.error ? <div className="note exact-inline-danger">{String(save.error.message || save.error)}</div> : null}
    <div className="split">
      <Card title="License & certification record" subtitle="Enter the rating details and validity dates.">
        <div className="form-grid two">
          <SelectField label="Category" value={license.category || ''} onChange={changeCategory} options={[{value:'',label:'Select a category…'},...categoryOptions]} />
          <SelectField label="Name" value={selectedNameIsCustom ? CUSTOM_NAME_VALUE : (license.name || '')} onChange={changeName} options={nameOptions} disabled={!license.category} />
          {selectedNameIsCustom ? <Field label="Custom name" value={license.name || ''} onChange={(v)=>change('name',v)} /> : null}
          <Field label="Number / reference" value={license.number || ''} onChange={(v)=>change('number',v)} />
          <Field label="Issued" type="date" value={toInputDate(license.issued)} onChange={(v)=>change('issued',fromInputDate(v))} />
          {showValidityDates ? <Field label="Valid from" type="date" value={toInputDate(license.valid_from)} onChange={(v)=>changeValidFrom(fromInputDate(v))} /> : null}
          {showValidityDates ? <Field label="Valid until" type="date" value={toInputDate(license.valid_until)} onChange={(v)=>change('valid_until',fromInputDate(v))} /> : null}
          {license.name ? <div className="muted" style={{gridColumn:'1 / -1',fontSize:12,marginTop:-2}}>{autoValidity ? `Valid until is calculated automatically: ${validityRule.label}. You can adjust it manually if needed.` : `${validityRule.label}.`}</div> : null}
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
          <div className="exact-panel-section"><strong>Validity</strong><div>{validityRule.kind === 'none' ? validityRule.label : `${license.valid_from || '—'} → ${license.valid_until || '—'}`}</div></div>
          <div className="exact-panel-section"><strong>Attachment</strong><div>{license.document_name || 'No document'}</div></div>
          {license.remarks ? <div className="exact-panel-section"><strong>Notes</strong><div>{license.remarks}</div></div> : null}
        </div>
      </Card>
    </div>
  </section>;
};
export default LicenseRecord;
