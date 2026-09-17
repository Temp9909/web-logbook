import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { updateAircraftModelsCategories } from '../../util/http/aircraft';
import { queryClient } from '../../util/http/http';
import { Field, Loading, Modal, SwitchRow } from '../AppleExact/Primitives';
import AircraftCategoryPicker from './AircraftCategoryPicker';

const emptyAutoFill = () => ({
  se_time: false,
  me_time: false,
  mcc_time: false,
  ifr_time: false,
  pic_time: false,
  co_pilot_time: false,
  dual_time: false,
  instructor_time: false,
});

const errorMessage = (error) => error?.info?.message || error?.message || 'Unknown error';

export const NewAircraftTypeModal = ({ open, onClose, modelOptions = [], categoryOptions = [] }) => {
  const [aircraftType, setAircraftType] = useState({ model: '', category: '', time_fields_auto_fill: emptyAutoFill() });
  const normalizedModels = useMemo(() => new Set(modelOptions.map((model) => String(model || '').trim().toUpperCase())), [modelOptions]);
  const model = aircraftType.model.trim().toUpperCase();
  const alreadyExists = Boolean(model) && normalizedModels.has(model);

  const createMutation = useMutation({
    mutationFn: () => updateAircraftModelsCategories({ payload: { ...aircraftType, model } }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['aircrafts'] }),
        queryClient.invalidateQueries({ queryKey: ['models-categories'] }),
      ]);
      onClose?.();
    },
  });

  return (
    <Modal
      open={open}
      title="New aircraft type"
      onClose={onClose}
      actions={<>
        <button className="btn" type="button" onClick={onClose}>Cancel</button>
        <button
          className="btn primary"
          type="button"
          disabled={createMutation.isPending || !model || alreadyExists}
          onClick={() => createMutation.mutate()}
        >
          {createMutation.isPending ? 'Creating…' : 'Create type'}
        </button>
      </>}
    >
      <Field
        label="Type"
        value={aircraftType.model}
        onChange={(value) => setAircraftType((current) => ({ ...current, model: value.toUpperCase() }))}
        placeholder="C172"
      />
      {alreadyExists ? <div className="note exact-error-note" style={{ marginTop: 10 }}>This aircraft type already exists.</div> : null}
      <AircraftCategoryPicker
        label="Categories"
        value={aircraftType.category}
        options={categoryOptions}
        onChange={(value) => setAircraftType((current) => ({ ...current, category: value }))}
      />
      <div className="section-label exact-autofill-label">Auto-fill total flight time into</div>
      <div className="card rows exact-autofill-card">
        {[
          ['se_time','Single Engine'],['me_time','Multi Engine'],['mcc_time','Multi Pilot'],['ifr_time','IFR'],
          ['pic_time','PIC'],['co_pilot_time','Co-pilot'],['dual_time','Dual'],['instructor_time','Instructor'],
        ].map(([key, label]) => (
          <SwitchRow
            key={key}
            label={label}
            checked={Boolean(aircraftType.time_fields_auto_fill?.[key])}
            onChange={(checked) => setAircraftType((current) => ({
              ...current,
              time_fields_auto_fill: { ...(current.time_fields_auto_fill || {}), [key]: checked },
            }))}
          />
        ))}
      </div>
      {createMutation.isError ? <div className="note exact-error-note">Unable to create aircraft type: {errorMessage(createMutation.error)}</div> : null}
      <Loading show={createMutation.isPending} />
    </Modal>
  );
};

export default NewAircraftTypeModal;
