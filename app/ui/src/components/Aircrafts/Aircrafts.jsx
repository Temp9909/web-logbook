import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchAircraftModelsCategories, fetchAircraftsBuildList, updateAircraft, updateAircraftModelsCategories } from '../../util/http/aircraft';
import { queryClient } from '../../util/http/http';
import { Card, Field, Loading, Modal, NativeTable, PageHead, SelectField, SwitchRow } from '../AppleExact/Primitives';
import AircraftCategoryPicker from './AircraftCategoryPicker';
import { DEFAULT_CATEGORIES, splitCategories } from './aircraftCategories';
import NewAircraftModal from './NewAircraftModal';
import NewAircraftTypeModal from './NewAircraftTypeModal';

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

const onlyCategories = (value, allowedValue) => {
  const allowed = new Set(splitCategories(allowedValue));
  return joinCategories(splitCategories(value).filter((category) => allowed.has(category)));
};

export const Aircrafts = () => {
  const { data: aircrafts = [], isLoading: loadingAircrafts } = useQuery({queryKey:['aircrafts','build-list'],queryFn:({signal})=>fetchAircraftsBuildList({signal})});
  const { data: categories = [], isLoading: loadingCategories } = useQuery({queryKey:['models-categories'],queryFn:({signal})=>fetchAircraftModelsCategories({signal})});
  const [newAircraftOpen,setNewAircraftOpen]=useState(false);
  const [newTypeOpen,setNewTypeOpen]=useState(false);
  const [editAircraft,setEditAircraft]=useState(null);
  const [editCategory,setEditCategory]=useState(null);
  const aircraftSaveQueue = useRef(Promise.resolve());
  const typeSaveQueue = useRef(Promise.resolve());
  const lastSavedReg = useRef('');

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
    mutationFn:(payload)=>updateAircraft({payload}),
    onSuccess:async()=>{
      await Promise.all([
        queryClient.invalidateQueries({queryKey:['aircrafts']}),
        queryClient.invalidateQueries({queryKey:['logbook']}),
      ]);
    }
  });

  const saveCategory=useMutation({
    mutationFn:(payload)=>updateAircraftModelsCategories({payload}),
    onSuccess:async()=>{
      await Promise.all([
        queryClient.invalidateQueries({queryKey:['aircrafts']}),
        queryClient.invalidateQueries({queryKey:['models-categories']}),
      ]);
    }
  });

  const queueAircraftSave = (snapshot) => {
    const queued = { ...snapshot };
    aircraftSaveQueue.current = aircraftSaveQueue.current
      .catch(() => undefined)
      .then(async () => {
        const payload = {
          ...queued,
          original_reg: lastSavedReg.current || queued.original_reg || queued.reg,
        };
        try {
          await saveAircraft.mutateAsync(payload);
          lastSavedReg.current = payload.reg;
          setEditAircraft((current) => current && current.reg === payload.reg
            ? { ...current, original_reg: payload.reg }
            : current);
        } catch {
          // Mutation state already exposes the save error in the modal.
        }
      });
    return aircraftSaveQueue.current;
  };

  const queueTypeSave = (snapshot) => {
    const queued = {
      ...snapshot,
      time_fields_auto_fill: { ...(snapshot?.time_fields_auto_fill || {}) },
    };
    typeSaveQueue.current = typeSaveQueue.current
      .catch(() => undefined)
      .then(async () => {
        try {
          await saveCategory.mutateAsync(queued);
        } catch {
          // Mutation state already exposes the save error in the modal.
        }
      });
    return typeSaveQueue.current;
  };

  const openAircraft = (row) => {
    const typeCategories = modelCategoryFor(categories, row.model)
      || joinCategories([...splitCategories(row.model_category || ''), ...splitCategories(row.excluded_model_category || '')]);
    const excluded = onlyCategories(row.excluded_model_category || '', typeCategories);
    const inherited = withoutCategories(typeCategories, excluded);
    lastSavedReg.current = row.reg;
    setEditAircraft({
      ...row,
      original_reg: row.reg,
      model_category: inherited,
      excluded_model_category: excluded,
      custom_category: withoutCategories(row.custom_category || '', inherited),
    });
  };

  const openCategory = (row) => setEditCategory({ ...row, time_fields_auto_fill: { ...(row?.time_fields_auto_fill || {}) } });

  const aircraftCols=useMemo(()=>[
    {key:'reg',label:'Registration',width:'24%'},
    {key:'model',label:'Type',width:'28%'},
    {
      key:'category',
      label:'Category',
      render:(row)=> <span className="exact-aircraft-category-value" title={row?.category || ''}>{row?.category || ''}</span>,
      searchValue:(row)=>row?.category || '',
    },
    {key:'chevron',label:'',width:34,render:()=> <span className="exact-row-chevron" aria-hidden="true">›</span>,searchValue:()=>''}
  ],[]);
  const categoryCols=useMemo(()=>[
    {key:'model',label:'Type'},
    {key:'category',label:'Category'},
    {key:'chevron',label:'',width:34,render:()=> <span className="exact-row-chevron" aria-hidden="true">›</span>,searchValue:()=>''}
  ],[]);

  const typeCategoriesForEditedAircraft = editAircraft
    ? (modelCategoryFor(categories, editAircraft.model)
      || joinCategories([
        ...splitCategories(editAircraft.model_category || ''),
        ...splitCategories(editAircraft.excluded_model_category || ''),
      ]))
    : '';
  const inheritedCategory = withoutCategories(
    typeCategoriesForEditedAircraft,
    editAircraft?.excluded_model_category || '',
  );

  // Keep the aircraft row behind the editor in sync immediately with the local
  // edit state. Autosave still persists the same values, but the UI no longer
  // waits for a network round-trip before showing the accumulated categories.
  const aircraftRows = useMemo(() => {
    if (!editAircraft) return aircrafts;
    const originalReg = editAircraft.original_reg || lastSavedReg.current || editAircraft.reg;
    const liveCategory = joinCategories([
      ...splitCategories(inheritedCategory),
      ...splitCategories(editAircraft.custom_category || ''),
    ]);
    return (Array.isArray(aircrafts) ? aircrafts : []).map((row) => {
      if (row?.reg !== originalReg && row?.reg !== editAircraft.reg) return row;
      return {
        ...row,
        reg: editAircraft.reg || row.reg,
        model: editAircraft.model || row.model,
        category: liveCategory,
      };
    });
  }, [aircrafts, editAircraft, inheritedCategory]);

  const changeEditedAircraftType = (model) => {
    if (!editAircraft) return;
    const nextInherited = modelCategoryFor(categories, model);
    const next = {
      ...editAircraft,
      model,
      model_category: nextInherited,
      excluded_model_category: '',
      custom_category: withoutCategories(editAircraft.custom_category || '', nextInherited),
    };
    setEditAircraft(next);
    queueAircraftSave(next);
  };

  const changeInheritedCategories = (nextInherited) => {
    if (!editAircraft) return;
    const allowedInherited = onlyCategories(nextInherited, typeCategoriesForEditedAircraft);
    const nextExcluded = withoutCategories(typeCategoriesForEditedAircraft, allowedInherited);
    const nextCustom = withoutCategories(editAircraft.custom_category || '', allowedInherited);
    const nextAircraft = {
      ...editAircraft,
      model_category: allowedInherited,
      excluded_model_category: nextExcluded,
      custom_category: nextCustom,
    };
    setEditAircraft(nextAircraft);
    queueAircraftSave(nextAircraft);
  };

  const changeExtraCategories = (nextCustom) => {
    if (!editAircraft) return;
    const next = {
      ...editAircraft,
      custom_category: withoutCategories(nextCustom, inheritedCategory),
    };
    setEditAircraft(next);
    queueAircraftSave(next);
  };

  const saveRegistrationOnBlur = (value) => {
    if (!editAircraft) return;
    const nextReg = String(value || '').trim().toUpperCase();
    if (!nextReg || nextReg === lastSavedReg.current) return;
    const next = { ...editAircraft, reg: nextReg };
    setEditAircraft(next);
    queueAircraftSave(next);
  };

  const changeEditedTypeCategories = (value) => {
    if (!editCategory) return;
    const next = { ...editCategory, category: value };
    setEditCategory(next);
    queueTypeSave(next);
  };

  const changeEditedTypeAutoFill = (key, checked) => {
    if (!editCategory) return;
    const next = {
      ...editCategory,
      time_fields_auto_fill: { ...(editCategory.time_fields_auto_fill || {}), [key]: checked },
    };
    setEditCategory(next);
    queueTypeSave(next);
  };

  return <section className="exact-react-page">
    <PageHead
      title="Aircrafts"
      subtitle="Manage registrations, aircraft types and categories."
      actions={<>
        <button className="btn" type="button" onClick={()=>setNewTypeOpen(true)}>＋ New type</button>
        <button className="btn primary" type="button" onClick={()=>setNewAircraftOpen(true)}>＋ New aircraft</button>
      </>}
    />
    <div className="grid two">
      <Card title="Aircrafts" subtitle="Registrations and aircraft types used by your logbook.">
        <div className="exact-aircraft-list-table">
          <NativeTable rows={aircraftRows} columns={aircraftCols} rowKey={(r)=>r.reg} loading={loadingAircrafts} searchPlaceholder="Search aircraft…" onRowClick={openAircraft} />
        </div>
      </Card>
      <Card title="Types & categories" subtitle="Configure aircraft categories and automatic time rules.">
        <NativeTable rows={categories} columns={categoryCols} rowKey={(r)=>r.model} loading={loadingCategories} searchPlaceholder="Search type…" onRowClick={openCategory} />
      </Card>
    </div>

    {newAircraftOpen ? <NewAircraftModal open modelOptions={modelOptions} categoryOptions={categoryOptions} onClose={()=>setNewAircraftOpen(false)} /> : null}
    {newTypeOpen ? <NewAircraftTypeModal open modelOptions={modelOptions} categoryOptions={categoryOptions} onClose={()=>setNewTypeOpen(false)} /> : null}

    <Modal open={!!editAircraft} title="Edit aircraft" onClose={()=>setEditAircraft(null)} showCloseButton hideActions>
      {editAircraft ? <>
        <div className="form-grid two">
          <Field
            label="Registration"
            value={editAircraft.reg || ''}
            onChange={(v)=>setEditAircraft((current)=>({...current,reg:v.toUpperCase()}))}
            onBlur={saveRegistrationOnBlur}
            onKeyDown={(event)=>{ if (event.key === 'Enter') event.currentTarget.blur(); }}
          />
          <SelectField label="Type" value={editAircraft.model || ''} options={[
            { value:'', label:'Select aircraft type' },
            ...Array.from(new Set([editAircraft.model, ...modelOptions].filter(Boolean))).map((value)=>({ value, label:value })),
          ]} onChange={changeEditedAircraftType} />
        </div>
        <AircraftCategoryPicker
          label="Categories inherited from type"
          value={inheritedCategory}
          options={splitCategories(typeCategoriesForEditedAircraft)}
          excludeOptions={splitCategories(editAircraft.custom_category || '')}
          onChange={changeInheritedCategories}
          includeDefaultOptions={false}
          allowNew={false}
        />
        <AircraftCategoryPicker
          label="Extra categories for this registration"
          value={editAircraft.custom_category || ''}
          options={categoryOptions}
          excludeOptions={splitCategories(inheritedCategory)}
          onChange={changeExtraCategories}
        />
        {saveAircraft.isError ? <div className="note exact-error-note">Unable to save aircraft: {saveAircraft.error?.info?.message || saveAircraft.error?.message || 'Unknown error'}</div> : null}
        <Loading show={saveAircraft.isPending}/>
      </> : null}
    </Modal>

    <Modal open={!!editCategory} title="Edit aircraft type" onClose={()=>setEditCategory(null)} showCloseButton hideActions>
      {editCategory ? <>
        <Field label="Type" value={editCategory.model || ''} readOnly/>
        <AircraftCategoryPicker label="Categories" value={editCategory.category || ''} options={categoryOptions} onChange={changeEditedTypeCategories}/>
        <div className="section-label exact-autofill-label">Auto-fill total flight time into</div>
        <div className="card rows exact-autofill-card">
          {[
            ['se_time','Single Engine'],['me_time','Multi Engine'],['mcc_time','Multi Pilot'],['ifr_time','IFR'],
            ['pic_time','PIC'],['co_pilot_time','Co-pilot'],['dual_time','Dual'],['instructor_time','Instructor'],
          ].map(([key,label])=><SwitchRow key={key} label={label} checked={Boolean(editCategory.time_fields_auto_fill?.[key])} onChange={(checked)=>changeEditedTypeAutoFill(key, checked)}/>) }
        </div>
        {saveCategory.isError ? <div className="note exact-error-note">Unable to save aircraft type: {saveCategory.error?.info?.message || saveCategory.error?.message || 'Unknown error'}</div> : null}
        <Loading show={saveCategory.isPending}/>
      </> : null}
    </Modal>
  </section>;
};
export default Aircrafts;
