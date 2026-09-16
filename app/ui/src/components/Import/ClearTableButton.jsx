import AppleToolbarButton from '../UIElements/AppleToolbarButton';
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
// MUI Icons
import CleaningServicesOutlinedIcon from '@mui/icons-material/CleaningServicesOutlined';
// Custom components

export const ClearTableButton = ({ setData }) => {
  return (
    <Tooltip title="Clear table">
      <AppleToolbarButton size="small" onClick={() => setData([])} color="default" label="Clear table">
        <CleaningServicesOutlinedIcon />
      </AppleToolbarButton>
    </Tooltip>
  );
}

export default ClearTableButton;