import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { FLIGHT_INITIAL_STATE } from '../../constants/constants';
import { createFlightRecord, deleteFlightRecord, fetchFlightData, updateFlightRecord } from '../../util/http/logbook';
import { fetchAircraftModels, fetchAircraftModelsCategories, fetchAircrafts } from '../../util/http/aircraft';
import { fetchPersons } from '../../util/http/person';
import { queryClient } from '../../util/http/http';
import useCustomFields from '../../hooks/useCustomFields';
import useSettings from '../../hooks/useSettings';
import FlightAttachments from '../FlightRecordAttachment/Attachments';
import { Card, ComboField, Field, Loading, PageHead, SelectField, TextArea, TimeSelectField, fromInputDate, personName, setNested, toInputDate } from '../AppleExact/Primitives';
import { DEFAULT_CATEGORIES, splitCategories } from '../Aircrafts/aircraftCategories';
import NewAircraftModal from '../Aircrafts/NewAircraftModal';
import { applyAutomaticFlightTimes, calculateFlightDuration, durationToMinutes, formatQuickFillLabel } from './flightTime';

const timeFields = [
  ['time.se_time','SE'],['time.me_time','ME'],['time.mcc_time','Multi-pilot'],
  ['time.night_time','Night'],['time.ifr_time','IFR'],['time.pic_time','PIC'],['time.co_pilot_time','Co-pilot'],
  ['time.dual_time','Dual'],['time.instructor_time','Instructor'],
];

const normalizedTimeFields = [['time.total_time', 'Total'], ...timeFields, ['sim.time', 'FSTD / Sim']];

const ROLE_FIELD = {
  PIC: 'pic_time',
  Dual: 'dual_time',
  'Co-pilot': 'co_pilot_time',
};

const isZeroFlightDuration = (value) => {
  if (value === 0) return true;
  const raw = String(value ?? '').trim();
  if (!raw) return false;
  const match = raw.match(/^(\d{1,3}):(\d{1,2})$/);
  return Boolean(match) && Number(match[1]) === 0 && Number(match[2]) === 0;
};

const normalizeFlightTimeZeroes = (record) => {
  let next = record;
  normalizedTimeFields.forEach(([key]) => {
    const value = key.split('.').reduce((current, part) => current?.[part], next);
    if (isZeroFlightDuration(value)) next = setNested(next, key, '');
  });
  return next;
};

const getFlightRole = (flight) => {
  if (flight?.time?.dual_time) return 'Dual';
  if (flight?.time?.co_pilot_time) return 'Co-pilot';
  if (flight?.time?.pic_time) return 'PIC';
  return '';
};

export const FlightRecord = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [flight, setFlight] = useState({ ...FLIGHT_INITIAL_STATE, uuid: id });
  const [newAircraftOpen, setNewAircraftOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { customFields = [] } = useCustomFields();
  const { settings } = useSettings();

  const { data, isLoading } = useQuery({
    queryKey: ['flight', id],
    queryFn: ({ signal }) => fetchFlightData({ signal, id }),
    enabled: id !== 'new',
    refetchOnWindowFocus: false,
  });

  const { data: aircraftData = [] } = useQuery({
    queryKey: ['aircrafts', 'list'],
    queryFn: ({ signal }) => fetchAircrafts({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
    refetchOnWindowFocus: false,
  });

  const { data: aircraftModelData = [] } = useQuery({
    queryKey: ['aircrafts', 'models'],
    queryFn: ({ signal }) => fetchAircraftModels({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
    refetchOnWindowFocus: false,
  });

  const { data: aircraftModelCategories = [] } = useQuery({
    queryKey: ['models-categories'],
    queryFn: ({ signal }) => fetchAircraftModelsCategories({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
    refetchOnWindowFocus: false,
  });

  const { data: personsData = [] } = useQuery({
    queryKey: ['persons'],
    queryFn: ({ signal }) => fetchPersons({ signal }),
    staleTime: 300000,
    gcTime: 3600000,
    refetchOnWindowFocus: false,
  });

  const aircrafts = useMemo(() => Array.isArray(aircraftData) ? aircraftData.filter(Boolean) : [], [aircraftData]);

  const registrationOptions = useMemo(() => (
    [...new Set(aircrafts.map((aircraft) => String(aircraft?.reg || '').trim().toUpperCase()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
  ), [aircrafts]);

  const typeOptions = useMemo(() => {
    const models = Array.isArray(aircraftModelData) ? aircraftModelData : [];
    return [...new Set([
      ...models.map((model) => String(model || '').trim().toUpperCase()),
      ...aircrafts.map((aircraft) => String(aircraft?.model || '').trim().toUpperCase()),
    ].filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [aircraftModelData, aircrafts]);

  const categoryOptions = useMemo(() => Array.from(new Set([
    ...DEFAULT_CATEGORIES,
    ...(Array.isArray(aircraftModelCategories) ? aircraftModelCategories.flatMap((row) => splitCategories(row?.category)) : []),
    ...aircrafts.flatMap((aircraft) => splitCategories(aircraft?.category)),
  ])).filter(Boolean).sort((a, b) => a.localeCompare(b)), [aircraftModelCategories, aircrafts]);

  const picNameOptions = useMemo(() => {
    const persons = Array.isArray(personsData) ? personsData : [];
    const selfPicLabel = String(settings?.self_pic_label || 'Self').trim();
    return [...new Set([
      selfPicLabel,
      ...persons
        .filter(Boolean)
        .map((person) => personName(person))
        .filter((name) => name && name !== 'Person'),
    ].filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [personsData, settings?.self_pic_label]);

  useEffect(() => {
    if (id === 'new') {
      const initialFlight = normalizeFlightTimeZeroes({ ...FLIGHT_INITIAL_STATE, uuid: 'new', ...(location.state || {}) });
      // Query/router data initializes the editable draft when the selected record changes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFlight(initialFlight);
      setSelectedRole(getFlightRole(initialFlight));
    } else if (data) {
      const loadedFlight = normalizeFlightTimeZeroes(data);
      setFlight(loadedFlight);
      setSelectedRole(getFlightRole(loadedFlight));
    }
  }, [data, id, location.state]);

  const change = useCallback((key, value) => setFlight((prev) => setNested(prev, key, value)), []);

  const handleRegistrationChange = useCallback((value) => {
    const registration = String(value || '').toUpperCase();
    setFlight((prev) => {
      let next = setNested(prev, 'aircraft.reg_name', registration);
      if (!registration) {
        return setNested(next, 'aircraft.model', '');
      }
      const match = aircrafts.find((aircraft) => String(aircraft?.reg || '').toUpperCase() === registration);
      if (match?.model) next = setNested(next, 'aircraft.model', String(match.model).toUpperCase());
      return next;
    });
  }, [aircrafts]);

  const handleAircraftCreated = useCallback((aircraft) => {
    setFlight((current) => {
      let next = setNested(current, 'aircraft.reg_name', String(aircraft?.reg || '').toUpperCase());
      next = setNested(next, 'aircraft.model', String(aircraft?.model || '').toUpperCase());
      return next;
    });
  }, []);

  const handleRoleChange = useCallback((role) => {
    setSelectedRole(role);
    setFlight((prev) => {
      const total = prev?.time?.total_time || '';
      const nextTime = {
        ...(prev.time || {}),
        pic_time: '',
        dual_time: '',
        co_pilot_time: '',
      };
      const targetField = ROLE_FIELD[role];
      if (targetField) nextTime[targetField] = total;

      const next = { ...prev, time: nextTime };
      if (id === 'new' && role === 'PIC') {
        next.pic_name = String(settings?.self_pic_label || 'Self').trim() || 'Self';
      }
      return next;
    });
  }, [id, settings?.self_pic_label]);

  const handleTimeChange = useCallback((key, value) => change(key, value), [change]);

  const computedTotalTime = useMemo(() => calculateFlightDuration(
    flight.departure?.time,
    flight.arrival?.time,
  ), [flight.departure?.time, flight.arrival?.time]);

  const activeAutoFill = useMemo(() => {
    const model = String(flight.aircraft?.model || '').toUpperCase();
    const row = (Array.isArray(aircraftModelCategories) ? aircraftModelCategories : [])
      .find((item) => String(item?.model || '').toUpperCase() === model);
    return row?.time_fields_auto_fill || {};
  }, [aircraftModelCategories, flight.aircraft?.model]);

  useEffect(() => {
    // UTC clocks and aircraft rules are inputs to the persisted editable draft.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFlight((current) => {
      const nextTime = applyAutomaticFlightTimes({
        time: current.time,
        totalTime: computedTotalTime,
        role: selectedRole,
        autoFill: activeAutoFill,
      });

      const keys = new Set([...Object.keys(current.time || {}), ...Object.keys(nextTime)]);
      const changed = Array.from(keys).some((key) => (current.time?.[key] || '') !== (nextTime[key] || ''));
      return changed ? { ...current, time: nextTime } : current;
    });
  }, [activeAutoFill, computedTotalTime, selectedRole]);

  const totalMinutes = useMemo(() => durationToMinutes(flight.time?.total_time), [flight.time?.total_time]);
  const quickFillLabel = formatQuickFillLabel(totalMinutes);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const normalizedFlight = normalizeFlightTimeZeroes(flight);
      return normalizedFlight.uuid === 'new' ? createFlightRecord({ flight: normalizedFlight }) : updateFlightRecord({ flight: normalizedFlight });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['logbook'] });
      navigate('/logbook');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteFlightRecord({ id: flight.uuid }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['logbook'] }); navigate('/logbook'); },
  });

  const handleDelete = () => setDeleteConfirmOpen(true);

  const confirmDelete = () => {
    setDeleteConfirmOpen(false);
    deleteMutation.mutate();
  };

  const actions = <>
    <button className="btn ghost" onClick={() => navigate('/logbook')}>Back</button>
    {id !== 'new' ? <button className="btn danger" onClick={handleDelete}>Delete</button> : null}
    <button className="btn primary" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>{saveMutation.isPending ? 'Saving…' : 'Done'}</button>
  </>;

  return (
    <section className="exact-react-page">
      {deleteConfirmOpen ? (
        <div
          className="apple-confirm-backdrop flight-delete-confirm-backdrop"
          role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteConfirmOpen(false); }}
        >
          <div className="flight-delete-confirm-sheet" role="dialog" aria-modal="true" aria-labelledby="flight-delete-confirm-title">
            <div id="flight-delete-confirm-title" className="flight-delete-confirm-title">You’re about to delete this flight record.</div>
            <div className="flight-delete-confirm-subtitle">Would you like to continue?</div>
            <div className="flight-delete-confirm-actions">
              <button type="button" className="flight-delete-confirm-button back" onClick={() => setDeleteConfirmOpen(false)} autoFocus>Back</button>
              <button type="button" className="flight-delete-confirm-button yes" onClick={confirmDelete}>Yes</button>
            </div>
          </div>
        </div>
      ) : null}
      <PageHead title={id === 'new' ? 'New flight' : 'Flight record'} subtitle={id === 'new' ? 'Create a new logbook entry.' : 'Review and edit the selected flight.'} actions={actions} />
      <Loading show={isLoading || saveMutation.isPending || deleteMutation.isPending} />
      {(saveMutation.error || deleteMutation.error) ? <div className="note exact-inline-danger">{String(saveMutation.error || deleteMutation.error)}</div> : null}
      <div className="grid two">
        <Card title="Flight" subtitle="Date, departure and arrival.">
          <div className="form-grid two">
            <Field label="Date" type="date" value={toInputDate(flight.date)} onChange={(v) => change('date', fromInputDate(v))} />
            <Field label="Tags" value={flight.tags || ''} onChange={(v) => change('tags', v)} placeholder="training, IFR" />
            <Field label="Departure place" value={flight.departure?.place || ''} onChange={(v) => change('departure.place', v.toUpperCase())} />
            <TimeSelectField label="Departure time (UTC)" mode="clock" value={flight.departure?.time || ''} onChange={(v) => change('departure.time', v)} />
            <Field label="Arrival place" value={flight.arrival?.place || ''} onChange={(v) => change('arrival.place', v.toUpperCase())} />
            <TimeSelectField label="Arrival time (UTC)" mode="clock" value={flight.arrival?.time || ''} onChange={(v) => change('arrival.time', v)} />
          </div>
        </Card>

        <Card
          title="Aircraft"
          subtitle="Registration, type, pilot in command and flight role."
          actions={<button className="btn small" type="button" onClick={() => setNewAircraftOpen(true)}>＋ New aircraft</button>}
        >
          <div className="form-grid two">
            <ComboField
              label="Registration"
              value={flight.aircraft?.reg_name || ''}
              onChange={handleRegistrationChange}
              options={Array.from(new Set([flight.aircraft?.reg_name, ...registrationOptions].filter(Boolean)))}
              placeholder="Select or enter registration"
            />
            <ComboField
              label="Type"
              value={flight.aircraft?.model || ''}
              onChange={(v) => change('aircraft.model', String(v || '').toUpperCase())}
              options={Array.from(new Set([flight.aircraft?.model, ...typeOptions].filter(Boolean)))}
              placeholder="Select or enter aircraft type"
            />
            <ComboField
              label="PIC name"
              value={flight.pic_name || ''}
              onChange={(v) => change('pic_name', v)}
              options={Array.from(new Set([flight.pic_name, ...picNameOptions].filter(Boolean)))}
              placeholder="Select or enter PIC name"
            />
            <SelectField
              label="Flight role"
              className="exact-flight-role-select"
              value={selectedRole}
              onChange={handleRoleChange}
              options={[
                { value: '', label: 'Select role' },
                'PIC',
                'Dual',
                'Co-pilot',
              ]}
            />
          </div>
          <div className="note" style={{ marginTop: 10 }}>
            Selecting a saved registration automatically fills its aircraft type. Selecting a flight role assigns the total flight time to PIC, Dual or Co-pilot.
          </div>
        </Card>

        <Card title="Flight time" subtitle="Operational and pilot function time.">
          <div className="form-grid two">
            <Field label="Flight time (block)" value={flight.time?.total_time || ''} readOnly placeholder="--:--" />
            {timeFields.map(([key,label]) => <TimeSelectField key={key} label={label} zeroAsEmpty value={key.split('.').reduce((o,k)=>o?.[k], flight) || ''} onChange={(v)=>handleTimeChange(key,v)} quickFillValue={flight.time?.total_time || ''} quickFillLabel={quickFillLabel} />)}
          </div>
        </Card>

        <Card title="Landings & remarks" subtitle="Landings, simulator and notes.">
          <div className="form-grid two">
            <Field label="Day landings" type="number" min="0" value={flight.landings?.day ?? ''} onChange={(v)=>change('landings.day',v)} />
            <Field label="Night landings" type="number" min="0" value={flight.landings?.night ?? ''} onChange={(v)=>change('landings.night',v)} />
            <Field label="FSTD type" value={flight.sim?.type || ''} onChange={(v)=>change('sim.type',v)} />
            <TimeSelectField label="FSTD time" value={flight.sim?.time || ''} onChange={(v)=>change('sim.time',v)} quickFillValue={flight.time?.total_time || ''} quickFillLabel={quickFillLabel} />
          </div>
          <div style={{marginTop:11}}><TextArea label="Remarks and endorsements" value={flight.remarks || ''} onChange={(v)=>change('remarks',v)} /></div>
        </Card>

        {customFields.length ? <Card title="Custom fields" subtitle="Additional fields configured in Settings." className="exact-full-span">
          <div className="form-grid">
            {customFields.map((field) => <Field key={field.uuid} label={field.name} value={flight.custom_fields?.[field.uuid] ?? ''} onChange={(v)=>change(`custom_fields.${field.uuid}`,v)} />)}
          </div>
        </Card> : null}
      </div>
      {id !== 'new' ? <div className="exact-flight-attachments-host"><FlightAttachments id={id} /></div> : null}
      {newAircraftOpen ? (
        <NewAircraftModal
          open
          modelOptions={typeOptions}
          categoryOptions={categoryOptions}
          onCreated={handleAircraftCreated}
          onClose={() => setNewAircraftOpen(false)}
        />
      ) : null}
    </section>
  );
};

export default FlightRecord;
