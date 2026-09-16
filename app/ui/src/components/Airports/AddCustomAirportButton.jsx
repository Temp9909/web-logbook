import AppleToolbarButton from '../UIElements/AppleToolbarButton';
import { useCallback } from 'react';
// MUI Icons
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
// Custom components and libraries
import AddEditCustomAirportModal from './AddEditCustomAirportModal';
import { useDialogs } from '../../hooks/useDialogs/useDialogs';

export const AddCustomAirportButton = () => {
  const dialogs = useDialogs();

  const handleOnClick = useCallback(async () => {
    const payload = { name: '', city: '', country: '', elevation: '', lat: '', lon: '', isNew: true };
    await dialogs.open(AddEditCustomAirportModal, payload);
  }, [dialogs]);

  return (
    <Tooltip title="New Custom Airport">
      <AppleToolbarButton onClick={handleOnClick} color="default" label="Add Custom Airport">
        <AddBoxOutlinedIcon fontSize='small' />
      </AppleToolbarButton>
    </Tooltip >
  )
}

export default AddCustomAirportButton;