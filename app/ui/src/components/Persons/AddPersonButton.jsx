import AppleToolbarButton from '../UIElements/AppleToolbarButton';
import { useCallback } from 'react';
// MUI Icons
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import AddEditPersonModal from './AddEditPersonModal';
import { IconButton } from '@mui/material';
import { useDialogs } from '../../hooks/useDialogs/useDialogs';

export const AddPersonButton = ({ onSave, isToolbarButton = true }) => {
  const dialogs = useDialogs();

  const handleOnClick = useCallback(async () => {
    const payload = { uuid: '', first_name: '', middle_name: '', last_name: '', isNew: true };
    const result = await dialogs.open(AddEditPersonModal, payload);
    if (onSave) onSave(result);
  }, [dialogs, onSave]);

  return (
    <Tooltip title="Add Person">
      {isToolbarButton
        ? <AppleToolbarButton onClick={handleOnClick} color="default" label="Add Person">
          <AddBoxOutlinedIcon />
        </AppleToolbarButton>
        : <IconButton size="small" component="label" onClick={handleOnClick}>
          <AddBoxOutlinedIcon />
        </IconButton>}
    </Tooltip >
  )
}

export default AddPersonButton;