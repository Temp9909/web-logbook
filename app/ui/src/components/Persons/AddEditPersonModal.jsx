import { useCallback, useState } from "react";
// MUI UI elements
import Dialog from "@mui/material/Dialog";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Grid from "@mui/material/Grid";
// MUI Icons
import DisabledByDefaultOutlinedIcon from "@mui/icons-material/DisabledByDefaultOutlined";
// Custom
import AppleDialogPanel from "../UIElements/AppleDialogPanel";
import TextField from "../UIElements/TextField";
import { printPerson } from "../../util/helpers";
import SavePersonButton from "./SavePersonButton";

const CloseDialogButton = ({ onClose }) => {
  return (
    <Tooltip title="Close">
      <IconButton size="small" onClick={onClose}>
        <DisabledByDefaultOutlinedIcon />
      </IconButton>
    </Tooltip>
  );
};

export const AddEditPersonModal = ({ open, onClose, payload }) => {
  const safePayload = payload && typeof payload === 'object' ? payload : {};
  const [person, setPerson] = useState({ first_name:'', middle_name:'', last_name:'', phone:'', email:'', remarks:'', ...safePayload });
  const isNew = Boolean(safePayload.isNew);

  const handleChange = useCallback((key, value) => {
    setPerson((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <Dialog fullWidth open={open} onClose={() => onClose()}>
      <AppleDialogPanel
        title={isNew ? 'New person' : `Person: ${printPerson(person)}`}
        subtitle="Contact and crew information."
        actions={<>
          <SavePersonButton person={person} onClose={onClose} isNew={isNew} />
          <CloseDialogButton onClose={() => onClose()} />
        </>}
      >
          <Grid container spacing={1}>
            <TextField
              gsize={{ xs: 12, sm: 4, md: 4, lg: 4, xl: 4 }}
              id="first_name"
              label="First name"
              handleChange={handleChange}
              value={person.first_name ?? ''}
            />
            <TextField
              gsize={{ xs: 12, sm: 4, md: 4, lg: 4, xl: 4 }}
              id="middle_name"
              label="Middle name"
              handleChange={handleChange}
              value={person.middle_name ?? ''}
            />
            <TextField
              gsize={{ xs: 12, sm: 4, md: 4, lg: 4, xl: 4 }}
              id="last_name"
              label="Last name"
              handleChange={handleChange}
              value={person.last_name ?? ''}
            />
            <TextField
              gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}
              id="phone"
              label="Phone"
              handleChange={handleChange}
              value={person.phone ?? ''}
            />
            <TextField
              gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}
              id="email"
              label="Email"
              handleChange={handleChange}
              value={person.email ?? ''}
            />
            <TextField
              gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
              id="remarks"
              label="Remarks"
              handleChange={handleChange}
              value={person.remarks ?? ''}
            />
          </Grid>
      </AppleDialogPanel>
    </Dialog>
  );
};

export default AddEditPersonModal;
