import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchAircraftModelsCategories, fetchAircraftsBuildList, updateAircraft, updateAircraftModelsCategories } from '../../util/http/aircraft';
import { queryClient } from '../../util/http/http';
import { Card, Field, Loading, Modal, NativeTable, PageHead, SelectField, SwitchRow } from '../AppleExact/Primitives';
import AircraftCategoryPicker from './AircraftCategoryPicker';
import { DEFAULT_CATEGORIES, splitCategories } from './aircraftCategories';
import NewAircraftModal from './NewAircraftModal';

const modelCategoryFor = (categories, model) => {
  const item = (Array.isArray(categories) ? categories : []).find((category) => category?.model === model);
  return item?.category || '';
};

const joinCategories = (categories) => Array.from(new Set(
  categories.map((category) => String(category || '').trim()).filter(Boolean),
)).join(',');

const withoutCategories = (value, excludedValue) => {
  const excluded = new Set(splitCategories(excludedValue));
  return joinCategories(splitCategories(value).filter((category) => !excluded.has(category)));
};

export const Aircrafts = () => {
  const { data: aircrafts = [], isLoading: loadingAircrafts } = useQuery({queryKey:['aircrafts','build-list'],queryFn:({signal})=>fetchAircraftsBuildList({signal})});
  const { data: categories = [], isLoading: loadingCategories } = useQuery({queryKey:['models-categories'],queryFn:({signal})=>fetchAircraftModelsCategories({signal})});
  const [newAircraftOpen,setNewAircraftOpen]=useState(false);
  const [editAircraft,setEditAircraft]=useState(null);
  const [editCategory,setEditCategory]=useState(null);

  const categoryOptions = useMemo(() => {
    const values = [];
    (Array.isArray(categories) ? categories : []).forEach((row)=>values.push(...splitCategories(row?.category)));
    (Array.isArray(aircrafts) ? aircrafts : []).forEach((row)=>{
      values.push(...splitCategories(row?.model_category));
      values.push(...splitCategories(row?.custom_category));
      values.push(...splitCategories(row?.category));
    });
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...values])).filter(Boolean).sort((a,b)=>a.localeCompare(b));
  }, [aircrafts, categories]);

  const modelOptions = useMemo(() => Array.from(new Set([
    ...(Array.isArray(categories) ? categories.map((row)=>row?.model) : []),
    ...(Array.isArray(aircrafts) ? aircrafts.map((row)=>row?.model) : []),
  ].filter(Boolean))).sort((a,b)=>a.localeCompare(b)), [aircrafts,categories]);

  const saveAircraft=useMutation({
    mutationFn:async()=>{
      await updateAircraft({payload:editAircraft});
      const typeRow = (Array.isArray(categories) ? categories : []).find((row) => row?.model === editAircraft?.model);
      const savedTypeCategories = typeRow?.category || '';
      if (joinCategories(splitCategories(savedTypeCategories)) !== joinCategories(splitCategories(editAircraft?.model_category))) {
        await updateAircraftModelsCategories({
          payload: {
            ...(typeRow || {}),
            model: editAircraft.model,
            category: editAircraft.model_category || '',
          },
        });
      }
    },
    onSuccess:async()=>{
      await Promise.all([
        queryClient.invalidateQueries({queryKey:['aircrafts']}),
        queryClient.invalidateQueries({queryKey:['models-categories']}),
        queryClient.invalidateQueries({queryKey:['logbook']}),
      ]);
      setEditAircraft(null);
    }
  });
  const saveCategory=useMutation({
    mutationFn:()=>updateAircraftModelsCategories({payload:editCategory}),
    onSuccess:async()=>{
      await Promise.all([
        queryClient.invalidateQueries({queryKey:['aircrafts']}),
        queryClient.invalidateQueries({queryKey:['models-categories']}),
      ]);
      setEditCategory(null);
    }
  });

  const openAircraft = (row) => {
    const inherited = modelCategoryFor(categories, row.model) || row.model_category || '';
    setEditAircraft({
      ...row,
      original_reg: row.reg,
      model_category: inherited,
      custom_category: withoutCategories(row.custom_category || '', inherited),
    });
  };
  const openCategory = (row) => setEditCategory({ ...row, time_fields_auto_fill: { ...(row?.time_fields_auto_fill || {}) } });

  const aircraftCols=useMemo(()=>[
    {key:'reg',label:'Registration'},
    {key:'model',label:'Type'},
    {key:'category',label:'Category'},
    {key:'chevron',label:'',width:34,render:()=> <span className="exact-row-chevron" aria-hidden="true">›</span>,searchValue:()=>''}
  ],[]);
  const categoryCols=useMemo(()=>[
    {key:'model',label:'Type'},
    {key:'category',label:'Category'},
    {key:'chevron',label:'',width:34,render:()=> <span className="exact-row-chevron" aria-hidden="true">›</span>,searchValue:()=>''}
  ],[]);

  const inheritedCategory = editAircraft?.model_category || '';

  const changeEditedAircraftType = (model) => {
    const nextInherited = modelCategoryFor(categories, model);
    setEditAircraft((current) => ({
      ...current,
      model,
      model_category: nextInherited,
      custom_category: withoutCategories(current?.custom_category || '', nextInherited),
    }));
  };

  const removeInheritedCategory = (category) => {
    setEditAircraft((current) => ({
      ...current,
      model_category: joinCategories(splitCategories(current?.model_category).filter((item) => item !== category)),
    }));
  };

  return <section className="exact-react-page">
    <PageHead title="Aircrafts" subtitle="Manage registrations, aircraft types and categories." actions={<button className="btn primary" type="button" onClick={()=>setNewAircraftOpen(true)}>＋ New aircraft</button>} />
    <div className="grid two">
      <Card title="Aircrafts" subtitle="Registrations and aircraft types used by your logbook.">
        <NativeTable rows={aircrafts} columns={aircraftCols} rowKey={(r)=>r.reg} loading={loadingAircrafts} searchPlaceholder="Search aircraft…" onRowClick={openAircraft} />
      </Card>
      <Card title="Types & categories" subtitle="Configure aircraft categories and automatic time rules.">
        <NativeTable rows={categories} columns={categoryCols} rowKey={(r)=>r.model} loading={loadingCategories} searchPlaceholder="Search type…" onRowClick={openCategory} />
      </Card>
    </div>

    {newAircraftOpen ? <NewAircraftModal open modelOptions={modelOptions} categoryOptions={categoryOptions} onClose={()=>setNewAircraftOpen(false)} /> : null}

    <Modal open={!!editAircraft} title="Edit aircraft" onClose={()=>setEditAircraft(null)} actions={<><button className="btn" onClick={()=>setEditAircraft(null)}>Cancel</button><button className="btn primary" disabled={saveAircraft.isPending || !editAircraft?.reg?.trim()} onClick={()=>saveAircraft.mutate()}>Save aircraft</button></>}>
      {editAircraft ? <>
        <div className="form-grid two">
          <Field label="Registration" value={editAircraft.reg || ''} onChange={(v)=>setEditAircraft(p=>({...p,reg:v.toUpperCase()}))}/>
          <SelectField label="Type" value={editAircraft.model || ''} options={[
            { value:'', label:'Select aircraft type' },
            ...Array.from(new Set([editAircraft.model, ...modelOptions].filter(Boolean))).map((value)=>({ value, label:value })),
          ]} onChange={changeEditedAircraftType} />
        </div>
        <div className="exact-inherited-category">
          <div className="field"><span>Categories inherited from type</span><div className="exact-readonly-chips">{splitCategories(inheritedCategory).length ? splitCategories(inheritedCategory).map((category)=><span className="chip exact-removable-category-chip" key={category}>{category}<button type="button" onClick={()=>removeInheritedCategory(category)} aria-label={`Remove ${category} from inherited categories`}>×</button></span>) : <span className="muted">No type category set yet</span>}</div></div>
        </div>
        <AircraftCategoryPicker label="Extra categories for this registration" value={editAircraft.custom_category || ''} options={categoryOptions} excludeOptions={splitCategories(inheritedCategory)} onChange={(v)=>setEditAircraft(p=>({...p,custom_category:withoutCategories(v,p.model_category)}))}/>
        {editAircraft.original_reg !== editAircraft.reg ? <div className="note">Changing the registration updates all logbook flights that use <strong>{editAircraft.original_reg}</strong>.</div> : null}
        {saveAircraft.isError ? <div className="note exact-error-note">Unable to save aircraft: {saveAircraft.error?.info?.message || saveAircraft.error?.message || 'Unknown error'}</div> : null}
        <Loading show={saveAircraft.isPending}/>
      </> : null}
    </Modal>

    <Modal open={!!editCategory} title="Edit aircraft type" onClose={()=>setEditCategory(null)} actions={<><button className="btn" onClick={()=>setEditCategory(null)}>Cancel</button><button className="btn primary" disabled={saveCategory.isPending} onClick={()=>saveCategory.mutate()}>Save type</button></>}>
      {editCategory ? <>
        <Field label="Type" value={editCategory.model || ''} readOnly/>
        <AircraftCategoryPicker label="Categories" value={editCategory.category || ''} options={categoryOptions} onChange={(v)=>setEditCategory(p=>({...p,category:v}))}/>
        <div className="section-label exact-autofill-label">Auto-fill total flight time into</div>
        <div className="card rows exact-autofill-card">
          {[
            ['se_time','Single Engine'],['me_time','Multi Engine'],['mcc_time','Multi Pilot'],['ifr_time','IFR'],
            ['pic_time','PIC'],['co_pilot_time','Co-pilot'],['dual_time','Dual'],['instructor_time','Instructor'],
          ].map(([key,label])=><SwitchRow key={key} label={label} checked={Boolean(editCategory.time_fields_auto_fill?.[key])} onChange={(checked)=>setEditCategory(p=>({...p,time_fields_auto_fill:{...(p.time_fields_auto_fill||{}),[key]:checked}}))}/>) }
        </div>
        {saveCategory.isError ? <div className="note exact-error-note">Unable to save aircraft type: {saveCategory.error?.info?.message || saveCategory.error?.message || 'Unknown error'}</div> : null}
        <Loading show={saveCategory.isPending}/>
      </> : null}
    </Modal>
  </section>;
};
export default Aircrafts;
