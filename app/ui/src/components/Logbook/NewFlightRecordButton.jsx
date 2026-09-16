import AppleToolbarButton from '../UIElements/AppleToolbarButton';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
// MUI Icons
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';

export const NewFlightRecordButton = () => {
  const navigate = useNavigate();

  const handleOnClick = useCallback(() => {
    navigate("/logbook/new");
  }, [navigate]);

  return (
    <Tooltip title="Add New Flight Record">
      <AppleToolbarButton onClick={handleOnClick} color="default" label='Add New Flight Record'>
        <AddBoxOutlinedIcon />
      </AppleToolbarButton>
    </Tooltip>
  )
}

export default NewFlightRecordButton;