import AppleToolbarButton from '../UIElements/AppleToolbarButton';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
// MUI Icons
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';

export const NewLicenseRecordButton = () => {
  const navigate = useNavigate();

  const handleOnClick = useCallback(() => {
    navigate("/licensing/new");
  }, [navigate]);

  return (
    <Tooltip title="Add New License Record">
      <AppleToolbarButton onClick={handleOnClick} color="default" label="Add New License Record">
        <AddBoxOutlinedIcon />
      </AppleToolbarButton>
    </Tooltip>
  )
}

export default NewLicenseRecordButton;