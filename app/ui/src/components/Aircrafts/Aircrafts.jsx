import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchAircraftModelsCategories, fetchAircraftsBuildList, updateAircraft, updateAircraftModelsCategories } from '../../util/http/aircraft';
import { queryClient } from '../../util/http/http';
import { Card, Field, Loading, Modal, NativeTable, PageHead } from '../AppleExact/Primitives';

export const Aircrafts = () => {
  const { data: aircrafts = [], isLoading: loadingAircrafts } = useQuery({queryKey:['aircrafts','build-list'],queryFn:({signal})=>fetchAircraftsBuildList({signal})});
  const { data: categories = [], isLoading: loadingCategories } = useQuery({queryKey:['models-categories'],queryFn:({signal})=>fetchAircraftModelsCategories({signal})});
  const [editAircraft,setEditAircraft]=useState(null);
  const [editCategory,setEditCategory]=useState(null);
  const saveAircraft=useMutation({mutationFn:()=>updateAircraft({payload:editAircraft}),onSuccess:async()=>{await queryClient.invalidateQueries({queryKey:['aircrafts']});setEditAircraft(null);}});
  const saveCategory=useMutation({mutationFn:()=>updateAircraftModelsCategories({payload:editCategory}),onSuccess:async()=>{await queryClient.invalidateQueries({queryKey:['models-categories']});setEditCategory(null);}});

  const aircraftCols=useMemo(()=>[
    {key:'reg',label:'Registration'},
    {key:'model',label:'Type'},
    {key:'category',label:'Category'},
    {key:'actions',label:'',render:(row)=><button className="btn small" onClick={(e)=>{e.stopPropagation();setEditAircraft({...row});}}>Edit</button>,searchValue:()=>''}
  ],[]);
  const categoryCols=useMemo(()=>[
    {key:'model',label:'Type'},
    {key:'category',label:'Category'},
    {key:'actions',label:'',render:(row)=><button className="btn small" onClick={(e)=>{e.stopPropagation();setEditCategory({...row});}}>Edit</button>,searchValue:()=>''}
  ],[]);

  return <section className="exact-react-page">
    <PageHead title="Aircrafts" subtitle="Manage registrations, aircraft types and categories." />
    <div className="grid two">
      <Card title="Aircrafts" subtitle="Registrations and aircraft types used by your logbook.">
        <NativeTable rows={aircrafts} columns={aircraftCols} rowKey={(r)=>r.reg} loading={loadingAircrafts} searchPlaceholder="Search aircraft…" />
      </Card>
      <Card title="Types & categories" subtitle="Configure aircraft categories and automatic time rules.">
        <NativeTable rows={categories} columns={categoryCols} rowKey={(r)=>r.model} loading={loadingCategories} searchPlaceholder="Search type…" />
      </Card>
    </div>
    <Modal open={!!editAircraft} title="Edit aircraft" onClose={()=>setEditAircraft(null)} actions={<><button className="btn" onClick={()=>setEditAircraft(null)}>Cancel</button><button className="btn primary" disabled={saveAircraft.isPending} onClick={()=>saveAircraft.mutate()}>Save aircraft</button></>}>
      {editAircraft ? <div className="form-grid two"><Field label="Registration" value={editAircraft.reg || ''} disabled/><Field label="Type" value={editAircraft.model || ''} onChange={(v)=>setEditAircraft(p=>({...p,model:v}))}/><Field label="Category" value={editAircraft.category || ''} onChange={(v)=>setEditAircraft(p=>({...p,category:v}))}/></div> : null}
      <Loading show={saveAircraft.isPending}/>
    </Modal>
    <Modal open={!!editCategory} title="Edit aircraft category" onClose={()=>setEditCategory(null)} actions={<><button className="btn" onClick={()=>setEditCategory(null)}>Cancel</button><button className="btn primary" disabled={saveCategory.isPending} onClick={()=>saveCategory.mutate()}>Save category</button></>}>
      {editCategory ? <div className="form-grid two"><Field label="Type" value={editCategory.model || ''} disabled/><Field label="Category" value={editCategory.category || ''} onChange={(v)=>setEditCategory(p=>({...p,category:v}))}/></div> : null}
      <Loading show={saveCategory.isPending}/>
    </Modal>
  </section>;
};
export default Aircrafts;
