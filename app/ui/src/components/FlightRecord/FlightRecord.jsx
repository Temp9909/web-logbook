import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { FLIGHT_INITIAL_STATE } from '../../constants/constants';
import { createFlightRecord, deleteFlightRecord, fetchFlightData, updateFlightRecord } from '../../util/http/logbook';
import { queryClient } from '../../util/http/http';
import useCustomFields from '../../hooks/useCustomFields';
import FlightMap from '../FlightMap/FlightMap';
import { Card, Field, Loading, PageHead, SelectField, TextArea, fromInputDate, setNested, toInputDate } from '../AppleExact/Primitives';

const timeFields = [
  ['time.total_time','Total'],['time.se_time','SE'],['time.me_time','ME'],['time.mcc_time','Multi-pilot'],
  ['time.night_time','Night'],['time.ifr_time','IFR'],['time.pic_time','PIC'],['time.co_pilot_time','Co-pilot'],
  ['time.dual_time','Dual'],['time.instructor_time','Instructor'],['sim.time','FSTD / Sim'],
];

export const FlightRecord = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [flight, setFlight] = useState({ ...FLIGHT_INITIAL_STATE, uuid: id });
  const { customFields = [] } = useCustomFields();

  const { data, isLoading } = useQuery({
    queryKey: ['flight', id],
    queryFn: ({ signal }) => fetchFlightData({ signal, id }),
    enabled: id !== 'new',
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (id === 'new') {
      setFlight({ ...FLIGHT_INITIAL_STATE, uuid: 'new', ...(location.state || {}) });
    } else if (data) setFlight(data);
  }, [data, id, location.state]);

  const change = useCallback((key, value) => setFlight((prev) => setNested(prev, key, value)), []);
  const mapData = useMemo(() => flight?.departure?.place && flight?.arrival?.place ? [flight] : [], [flight]);

  const saveMutation = useMutation({
    mutationFn: async () => flight.uuid === 'new' ? createFlightRecord({ flight }) : updateFlightRecord({ flight }),
    onSuccess: async (result) => {
      const newId = flight.uuid === 'new' ? result?.data : flight.uuid;
      await queryClient.invalidateQueries({ queryKey: ['logbook'] });
      if (newId && flight.uuid === 'new') navigate(`/logbook/${newId}`, { replace: true });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteFlightRecord({ id: flight.uuid }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['logbook'] }); navigate('/logbook'); },
  });

  const actions = <>
    <button className="btn ghost" onClick={() => navigate('/logbook')}>Cancel</button>
    {id !== 'new' ? <button className="btn danger" onClick={() => { if (confirm('Delete this flight record?')) deleteMutation.mutate(); }}>Delete</button> : null}
    <button className="btn primary" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>{saveMutation.isPending ? 'Saving…' : 'Save flight'}</button>
  </>;

  return (
    <section className="exact-react-page">
      <PageHead title={id === 'new' ? 'New flight' : 'Flight record'} subtitle={id === 'new' ? 'Create a new logbook entry.' : 'Review and edit the selected flight.'} actions={actions} />
      <Loading show={isLoading || saveMutation.isPending || deleteMutation.isPending} />
      {(saveMutation.error || deleteMutation.error) ? <div className="note exact-inline-danger">{String(saveMutation.error || deleteMutation.error)}</div> : null}
      <div className="grid two">
        <Card title="Flight" subtitle="Date, departure and arrival.">
          <div className="form-grid two">
            <Field label="Date" type="date" value={toInputDate(flight.date)} onChange={(v) => change('date', fromInputDate(v))} />
            <Field label="Tags" value={flight.tags || ''} onChange={(v) => change('tags', v)} placeholder="training, IFR" />
            <Field label="Departure place" value={flight.departure?.place || ''} onChange={(v) => change('departure.place', v.toUpperCase())} />
            <Field label="Departure time" value={flight.departure?.time || ''} onChange={(v) => change('departure.time', v)} placeholder="0815" />
            <Field label="Arrival place" value={flight.arrival?.place || ''} onChange={(v) => change('arrival.place', v.toUpperCase())} />
            <Field label="Arrival time" value={flight.arrival?.time || ''} onChange={(v) => change('arrival.time', v)} placeholder="0935" />
          </div>
        </Card>

        <Card title="Aircraft" subtitle="Registration, type and pilot in command.">
          <div className="form-grid two">
            <Field label="Registration" value={flight.aircraft?.reg_name || ''} onChange={(v) => change('aircraft.reg_name', v.toUpperCase())} />
            <Field label="Type" value={flight.aircraft?.model || ''} onChange={(v) => change('aircraft.model', v.toUpperCase())} />
            <Field label="PIC name" value={flight.pic_name || ''} onChange={(v) => change('pic_name', v)} />
            <SelectField label="Flight role" value={flight.time?.pic_time ? 'PIC' : flight.time?.dual_time ? 'Dual' : flight.time?.co_pilot_time ? 'Co-pilot' : 'PIC'} onChange={() => {}} options={['PIC','Dual','Co-pilot']} disabled />
          </div>
        </Card>

        <Card title="Flight time" subtitle="Operational and pilot function time.">
          <div className="form-grid">
            {timeFields.map(([key,label]) => <Field key={key} label={label} value={key.split('.').reduce((o,k)=>o?.[k], flight) || ''} onChange={(v)=>change(key,v)} placeholder="00:00" />)}
          </div>
        </Card>

        <Card title="Landings & remarks" subtitle="Landings, simulator and notes.">
          <div className="form-grid two">
            <Field label="Day landings" type="number" min="0" value={flight.landings?.day ?? ''} onChange={(v)=>change('landings.day',v)} />
            <Field label="Night landings" type="number" min="0" value={flight.landings?.night ?? ''} onChange={(v)=>change('landings.night',v)} />
            <Field label="FSTD type" value={flight.sim?.type || ''} onChange={(v)=>change('sim.type',v)} />
            <Field label="FSTD time" value={flight.sim?.time || ''} onChange={(v)=>change('sim.time',v)} placeholder="00:00" />
          </div>
          <div style={{marginTop:11}}><TextArea label="Remarks and endorsements" value={flight.remarks || ''} onChange={(v)=>change('remarks',v)} /></div>
        </Card>

        {customFields.length ? <Card title="Custom fields" subtitle="Additional fields configured in Settings." className="exact-full-span">
          <div className="form-grid">
            {customFields.map((field) => <Field key={field.uuid} label={field.name} value={flight.custom_fields?.[field.uuid] ?? ''} onChange={(v)=>change(`custom_fields.${field.uuid}`,v)} />)}
          </div>
        </Card> : null}
      </div>
      {id !== 'new' && mapData.length ? <div className="exact-map-host" style={{marginTop:12}}><FlightMap data={mapData} title="Flight map" /></div> : null}
    </section>
  );
};

export default FlightRecord;
