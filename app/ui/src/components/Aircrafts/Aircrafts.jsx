import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchAircraftModelsCategories, fetchAircraftsBuildList, updateAircraft, updateAircraftModelsCategories } from '../../util/http/aircraft';
import { queryClient } from '../../util/http/http';
import { Card, Field, Loading, Modal, NativeTable, PageHead, SelectField, SwitchRow } from '../AppleExact/Primitives';
import NewAircraftModal from './NewAircraftModal';

const DEFAULT_CATEGORIES = [
  'Single Engine',
  'Multi Engine',
  'Multi Pilot',
  'IFR',
  'Complex',
  'Tailwheel',
  'Turboprop',
  'Jet',
  'Helicopter',
  'Glider',
];

const splitCategories = (value) => String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
const joinCategories = (items) => Array.from(new Set(items.map((item) => String(item || '').trim()).filter(Boolean))).join(',');

function CategoryPicker({ label = 'Category', value = '', options = [], onChange }) {
  const [newCategory, setNewCategory] = useState('');
  const selected = useMemo(() => new Set(splitCategories(value)), [value]);
  const allOptions = useMemo(() => Array.from(new Set([...DEFAULT_CATEGORIES, ...options, ...splitCategories(value)])).filter(Boolean).sort((a,b)=>a.localeCompare(b)), [options, value]);

  const toggle = (category) => {
    const next = new Set(selected);
    if (next.has(category)) next.delete(category);
    else next.add(category);
    onChange?.(joinCategories(Array.from(next)));
  };

  const addCategory = () => {
    const nextCategory = newCategory.trim();
    if (!nextCategory) return;
    const next = new Set(selected);
    next.add(nextCategory);
    onChange?.(joinCategories(Array.from(next)));
    setNewCategory('');
  };

  return <div className="field exact-category-field">
    <span>{label}</span>
    <div className="exact-category-picker">
      {allOptions.map((category) => <button key={category} type="button" className={`exact-category-option${selected.has(category) ? ' selected' : ''}`} onClick={()=>toggle(category)}>{category}</button>)}
    </div>
    <div className="row exact-category-add-row">
      <input className="input" value={newCategory} onChange={(e)=>setNewCategory(e.target.value)} onKeyDown={(e)=>{if(e.key==='Enter'){e.preventDefault();addCategory();}}} placeholder="New category…" />
      <button type="button" className="btn small" onClick={addCategory}>Add</button>
    </div>
  </div>;
}

const modelCategoryFor = (categories, model) => {
  const item = (Array.isArray(categories) ? categories : []).find((category) => category?.model === model);
  return item?.category || '';
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
    mutationFn:()=>updateAircraft({payload:editAircraft}),
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

  const openAircraft = (row) => setEditAircraft({ ...row, original_reg: row.reg });
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

  const inheritedCategory = editAircraft ? modelCategoryFor(categories, editAircraft.model) : '';

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

    {newAircraftOpen ? <NewAircraftModal open modelOptions={modelOptions} onClose={()=>setNewAircraftOpen(false)} /> : null}

    <Modal open={!!editAircraft} title="Edit aircraft" onClose={()=>setEditAircraft(null)} actions={<><button className="btn" onClick={()=>setEditAircraft(null)}>Cancel</button><button className="btn primary" disabled={saveAircraft.isPending || !editAircraft?.reg?.trim()} onClick={()=>saveAircraft.mutate()}>Save aircraft</button></>}>
      {editAircraft ? <>
        <div className="form-grid two">
          <Field label="Registration" value={editAircraft.reg || ''} onChange={(v)=>setEditAircraft(p=>({...p,reg:v.toUpperCase()}))}/>
          <SelectField label="Type" value={editAircraft.model || ''} options={[
            { value:'', label:'Select aircraft type' },
            ...Array.from(new Set([editAircraft.model, ...modelOptions].filter(Boolean))).map((value)=>({ value, label:value })),
          ]} onChange={(v)=>setEditAircraft(p=>({...p,model:v}))} />
        </div>
        <div className="exact-inherited-category">
          <div className="field"><span>Categories inherited from type</span><div className="exact-readonly-chips">{splitCategories(inheritedCategory || editAircraft.model_category).length ? splitCategories(inheritedCategory || editAircraft.model_category).map((category)=><span className="chip" key={category}>{category}</span>) : <span className="muted">No type category set yet</span>}</div></div>
        </div>
        <CategoryPicker label="Extra categories for this registration" value={editAircraft.custom_category || ''} options={categoryOptions} onChange={(v)=>setEditAircraft(p=>({...p,custom_category:v}))}/>
        {editAircraft.original_reg !== editAircraft.reg ? <div className="note">Changing the registration updates all logbook flights that use <strong>{editAircraft.original_reg}</strong>.</div> : null}
        {saveAircraft.isError ? <div className="note exact-error-note">Unable to save aircraft: {saveAircraft.error?.info?.message || saveAircraft.error?.message || 'Unknown error'}</div> : null}
        <Loading show={saveAircraft.isPending}/>
      </> : null}
    </Modal>

    <Modal open={!!editCategory} title="Edit aircraft type" onClose={()=>setEditCategory(null)} actions={<><button className="btn" onClick={()=>setEditCategory(null)}>Cancel</button><button className="btn primary" disabled={saveCategory.isPending} onClick={()=>saveCategory.mutate()}>Save type</button></>}>
      {editCategory ? <>
        <Field label="Type" value={editCategory.model || ''} readOnly/>
        <CategoryPicker label="Categories" value={editCategory.category || ''} options={categoryOptions} onChange={(v)=>setEditCategory(p=>({...p,category:v}))}/>
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
