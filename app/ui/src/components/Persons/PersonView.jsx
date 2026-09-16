import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchLogsForPerson, fetchPersonByUuid, updatePerson } from '../../util/http/person';
import { queryClient } from '../../util/http/http';
import { Card, Field, Loading, NativeTable, PageHead, TextArea, personName } from '../AppleExact/Primitives';

export const PersonView=()=>{
  const {uuid}=useParams();const navigate=useNavigate();const [person,setPerson]=useState({});
  const {data,isLoading}=useQuery({queryKey:['persons','person',uuid],queryFn:({signal})=>fetchPersonByUuid({signal,uuid})});
  const {data:flights=[],isLoading:flightsLoading}=useQuery({queryKey:['persons','flights',uuid],queryFn:({signal})=>fetchLogsForPerson({signal,personUuid:uuid})});
  useEffect(()=>{if(data)setPerson(data)},[data]);
  const save=useMutation({mutationFn:()=>updatePerson({payload:person}),onSuccess:()=>queryClient.invalidateQueries({queryKey:['persons']})});
  const cols=useMemo(()=>[
    {key:'date',label:'Date'},{key:'departure',label:'Departure',render:r=>`${r.departure?.place||''} ${r.departure?.time||''}`},{key:'arrival',label:'Arrival',render:r=>`${r.arrival?.place||''} ${r.arrival?.time||''}`},{key:'aircraft',label:'Aircraft',render:r=>`${r.aircraft?.model||''} / ${r.aircraft?.reg_name||''}`},{key:'total',label:'Total',render:r=>r.time?.total_time||''}
  ],[]);
  return <section className="exact-react-page"><PageHead title={personName(data)||'Person'} subtitle="Person details and associated flights." actions={<><button className="btn ghost" onClick={()=>navigate('/persons')}>Back</button><button className="btn primary" disabled={save.isPending} onClick={()=>save.mutate()}>Save person</button></>}/><Loading show={isLoading||save.isPending}/><div className="split"><Card title="Associated flights" subtitle="Flights linked to this person."><NativeTable rows={flights} columns={cols} rowKey={(r,i)=>r.uuid||i} loading={flightsLoading} onRowClick={r=>r.uuid&&navigate(`/logbook/${r.uuid}`)} /></Card><Card title="Person data" subtitle="Contact and logbook information."><div className="form-grid two"><Field label="First name" value={person.first_name||''} onChange={v=>setPerson(p=>({...p,first_name:v}))}/><Field label="Middle name" value={person.middle_name||''} onChange={v=>setPerson(p=>({...p,middle_name:v}))}/><Field label="Last name" value={person.last_name||''} onChange={v=>setPerson(p=>({...p,last_name:v}))}/><Field label="Phone" value={person.phone||''} onChange={v=>setPerson(p=>({...p,phone:v}))}/><Field label="Email" value={person.email||''} onChange={v=>setPerson(p=>({...p,email:v}))}/></div><div style={{marginTop:11}}><TextArea label="Remarks" value={person.remarks||''} onChange={v=>setPerson(p=>({...p,remarks:v}))}/></div></Card></div></section>
};
export default PersonView;
