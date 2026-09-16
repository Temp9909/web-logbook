import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchLogsForPerson, fetchPersonByUuid, updatePerson } from '../../util/http/person';
import { queryClient } from '../../util/http/http';
import { Card, EmptyState, Field, Loading, NativeTable, PageHead, TextArea, personName } from '../AppleExact/Primitives';

const EMPTY_PERSON = { uuid:'', first_name:'', middle_name:'', last_name:'', phone:'', email:'', remarks:'' };

export const PersonView = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState({ ...EMPTY_PERSON, uuid: uuid || '' });

  const { data, isLoading, isError } = useQuery({
    queryKey:['persons','person',uuid],
    queryFn:({signal})=>fetchPersonByUuid({signal,uuid}),
    enabled:Boolean(uuid),
  });

  const { data:flightsData, isLoading:flightsLoading } = useQuery({
    queryKey:['persons','flights',uuid],
    queryFn:({signal})=>fetchLogsForPerson({signal,personUuid:uuid}),
    enabled:Boolean(uuid),
  });

  const flights = Array.isArray(flightsData) ? flightsData.filter(Boolean) : [];

  useEffect(() => {
    if (data && typeof data === 'object') setPerson({ ...EMPTY_PERSON, ...data });
    else if (!isLoading) setPerson({ ...EMPTY_PERSON, uuid: uuid || '' });
  }, [data, isLoading, uuid]);

  const save = useMutation({
    mutationFn:()=>updatePerson({payload:person}),
    onSuccess:async()=>{
      await queryClient.invalidateQueries({queryKey:['persons']});
      await queryClient.invalidateQueries({queryKey:['persons','person',uuid]});
    },
  });

  const cols = useMemo(()=>[
    {key:'date',label:'Date'},
    {key:'role',label:'Role'},
    {key:'departure',label:'Departure'},
    {key:'arrival',label:'Arrival'},
    {key:'aircraft',label:'Aircraft',render:r=>`${r?.aircraft?.model || ''}${r?.aircraft?.reg_name ? ` / ${r.aircraft.reg_name}` : ''}`},
    {key:'total_time',label:'Total'},
  ],[]);

  const title = data && typeof data === 'object' ? personName(data) : 'Person';

  return <section className="exact-react-page">
    <PageHead
      title={title}
      subtitle="Person details and associated flights."
      actions={<>
        <button className="btn ghost" onClick={()=>navigate('/persons')}>Back</button>
        <button className="btn primary" disabled={save.isPending || !person.uuid} onClick={()=>save.mutate()}>Save person</button>
      </>}
    />
    <Loading show={isLoading || save.isPending}/>
    {isError ? <Card><EmptyState>Unable to load this person.</EmptyState></Card> : null}
    <div className="split">
      <Card title="Associated flights" subtitle="Flights linked to this person.">
        <NativeTable
          rows={flights}
          columns={cols}
          rowKey={(r,i)=>r?.log_uuid || i}
          loading={flightsLoading}
          searchPlaceholder="Search associated flights…"
          onRowClick={r=>r?.log_uuid && navigate(`/logbook/${r.log_uuid}`)}
          empty="No flights linked to this person"
        />
      </Card>
      <Card title="Person data" subtitle="Contact and logbook information.">
        <div className="form-grid two">
          <Field label="First name" value={person.first_name || ''} onChange={v=>setPerson(p=>({...p,first_name:v}))}/>
          <Field label="Middle name" value={person.middle_name || ''} onChange={v=>setPerson(p=>({...p,middle_name:v}))}/>
          <Field label="Last name" value={person.last_name || ''} onChange={v=>setPerson(p=>({...p,last_name:v}))}/>
          <Field label="Phone" value={person.phone || ''} onChange={v=>setPerson(p=>({...p,phone:v}))}/>
          <Field label="Email" type="email" value={person.email || ''} onChange={v=>setPerson(p=>({...p,email:v}))}/>
        </div>
        <div style={{marginTop:11}}><TextArea label="Remarks" value={person.remarks || ''} onChange={v=>setPerson(p=>({...p,remarks:v}))}/></div>
      </Card>
    </div>
  </section>;
};

export default PersonView;
