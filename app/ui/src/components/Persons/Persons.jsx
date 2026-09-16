import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createPerson, deletePerson, fetchPersons, updatePerson } from '../../util/http/person';
import { queryClient } from '../../util/http/http';
import { Card, Field, Loading, Modal, NativeTable, PageHead, TextArea, personName } from '../AppleExact/Primitives';

const blank={uuid:'',first_name:'',middle_name:'',last_name:'',phone:'',email:'',remarks:'',isNew:true};
export const Persons=()=>{
  const navigate=useNavigate();
  const {data=[],isLoading}=useQuery({queryKey:['persons'],queryFn:({signal})=>fetchPersons({signal}),staleTime:3600000});
  const [person,setPerson]=useState(null);
  const save=useMutation({mutationFn:()=>person.isNew?createPerson({payload:person}):updatePerson({payload:person}),onSuccess:async()=>{await queryClient.invalidateQueries({queryKey:['persons']});setPerson(null);}});
  const remove=useMutation({mutationFn:(uuid)=>deletePerson({uuid}),onSuccess:()=>queryClient.invalidateQueries({queryKey:['persons']})});
  const cols=useMemo(()=>[
    {key:'name',label:'Name',render:r=>personName(r),searchValue:r=>personName(r)},
    {key:'phone',label:'Phone'},{key:'email',label:'Email'},{key:'remarks',label:'Remarks'},
    {key:'actions',label:'',render:r=><div className="exact-actions-cell"><button className="btn small" onClick={e=>{e.stopPropagation();navigate(`/persons/${r.uuid}`)}}>View</button><button className="btn small" onClick={e=>{e.stopPropagation();setPerson({...r,isNew:false})}}>Edit</button><button className="btn danger small" onClick={e=>{e.stopPropagation();if(confirm('Delete this person?'))remove.mutate(r.uuid)}}>Delete</button></div>,searchValue:()=>''}
  ],[navigate,remove]);
  return <section className="exact-react-page">
    <PageHead title="Persons" subtitle="Manage pilots, crew and other people in your logbook." actions={<button className="btn primary" onClick={()=>setPerson({...blank})}>＋ Add person</button>} />
    <Card title="People" subtitle="Pilots, crew and contacts linked to your logbook."><NativeTable rows={data} columns={cols} rowKey={r=>r.uuid} loading={isLoading} searchPlaceholder="Search name, email or phone…" onRowClick={r=>navigate(`/persons/${r.uuid}`)} /></Card>
    <Modal open={!!person} title={person?.isNew?'Add person':`Edit ${personName(person)}`} onClose={()=>setPerson(null)} actions={<><button className="btn" onClick={()=>setPerson(null)}>Cancel</button><button className="btn primary" disabled={save.isPending} onClick={()=>save.mutate()}>Save person</button></>}>
      {person?<><div className="form-grid three"><Field label="First name" value={person.first_name||''} onChange={v=>setPerson(p=>({...p,first_name:v}))}/><Field label="Middle name" value={person.middle_name||''} onChange={v=>setPerson(p=>({...p,middle_name:v}))}/><Field label="Last name" value={person.last_name||''} onChange={v=>setPerson(p=>({...p,last_name:v}))}/><Field label="Phone" value={person.phone||''} onChange={v=>setPerson(p=>({...p,phone:v}))}/><Field label="Email" type="email" value={person.email||''} onChange={v=>setPerson(p=>({...p,email:v}))}/></div><div style={{marginTop:11}}><TextArea label="Remarks" value={person.remarks||''} onChange={v=>setPerson(p=>({...p,remarks:v}))}/></div></>:null}
      <Loading show={save.isPending}/>
    </Modal>
  </section>;
};
export default Persons;
