import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createAircraft } from '../../util/http/aircraft';
import { queryClient } from '../../util/http/http';
import { ComboField, Field, Loading, Modal } from '../AppleExact/Primitives';
import AircraftCategoryPicker from './AircraftCategoryPicker';

const errorMessage = (error) => error?.info?.message || error?.message || 'Unknown error';

export const NewAircraftModal = ({ open, onClose, onCreated, modelOptions = [], categoryOptions = [] }) => {
  const [aircraft, setAircraft] = useState({ reg: '', model: '', custom_category: '' });

  const createMutation = useMutation({
    mutationFn: () => createAircraft({ payload: aircraft }),
    onSuccess: async (createdAircraft) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['aircrafts'] }),
        queryClient.invalidateQueries({ queryKey: ['models-categories'] }),
      ]);
      onCreated?.(createdAircraft || aircraft);
      onClose?.();
    },
  });

  return (
    <Modal
      open={open}
      title="New aircraft"
      onClose={onClose}
      actions={<>
        <button className="btn exact-secondary-action" type="button" onClick={onClose}>Back</button>
        <button
          className="btn primary"
          type="button"
          disabled={createMutation.isPending || !aircraft.reg.trim() || !aircraft.model.trim()}
          onClick={() => createMutation.mutate()}
        >
          {createMutation.isPending ? 'Creating…' : 'Create aircraft'}
        </button>
      </>}
    >
      <div className="form-grid two">
        <Field
          label="Registration"
          value={aircraft.reg}
          onChange={(value) => setAircraft((current) => ({ ...current, reg: value.toUpperCase() }))}
          placeholder="F-GABC"
        />
        <ComboField
          id="new-aircraft-type"
          label="Type"
          value={aircraft.model}
          onChange={(value) => setAircraft((current) => ({ ...current, model: value.toUpperCase() }))}
          placeholder="C172"
          options={modelOptions}
        />
      </div>
      <AircraftCategoryPicker
        label="Categories"
        value={aircraft.custom_category}
        options={categoryOptions}
        onChange={(value) => setAircraft((current) => ({ ...current, custom_category: value }))}
      />
      <div className="note" style={{ marginTop: 10 }}>The aircraft will be available immediately in flight records.</div>
      {createMutation.isError ? <div className="note exact-error-note">Unable to create aircraft: {errorMessage(createMutation.error)}</div> : null}
      <Loading show={createMutation.isPending} />
    </Modal>
  );
};

export default NewAircraftModal;
