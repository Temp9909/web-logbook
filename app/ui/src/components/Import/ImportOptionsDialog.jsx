import { useCallback, useState } from "react";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import Dialog from '@mui/material/Dialog';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
// MUI Icons
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import DisabledByDefaultOutlinedIcon from '@mui/icons-material/DisabledByDefaultOutlined';
// Custom components
import AppleDialogPanel from "../UIElements/AppleDialogPanel";
import OptionSwitch from "../UIElements/OptionSwitch";
import useSettings from "../../hooks/useSettings";

const DEFAULT_OPTIONS = {
  backup: false,
  create_persons: false,
  create_person_format: "",
  create_person_from: { pic: true },
};

const TOGGLE_BUTTONS = [
  {
    value: "fn_mn_ln",
    label: "FN MN LN",
    tooltip: (
      <>
        <b>First Name, Middle Name, Last Name.</b> <br />
        Example:<br />
        &nbsp;&nbsp; 3 parts → First / Middle / Last<br />
        &nbsp;&nbsp; 2 parts → First / Last<br />
        &nbsp;&nbsp; 1 part → Last
      </>
    )
  },
  {
    value: "ln_fn_md",
    label: "LN FN MD",
    tooltip: (
      <>
        <b>Last Name, First Name, Middle Name.</b> <br />
        Example:<br />
        &nbsp;&nbsp; 3 parts → Last / First / Middle<br />
        &nbsp;&nbsp; 2 parts → Last / First<br />
        &nbsp;&nbsp; 1 part → Last
      </>
    )
  },
  {
    value: "fn_ln_md",
    label: "FN LN MD",
    tooltip: (
      <>
        <b>First Name, Last Name, Middle Name.</b> <br />
        Example:<br />
        &nbsp;&nbsp; 3 parts → First / Last / Middle<br />
        &nbsp;&nbsp; 2 parts → First / Last<br />
        &nbsp;&nbsp; 1 part → First
      </>
    )
  }
]

const ImportOptionsDialog = ({ open, onClose }) => {
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const { fieldNameF } = useSettings();

  const PICFieldName = fieldNameF("pic_name");

  const handleChange = useCallback((key, value) => {
    setOptions((options) => {
      const keys = key.split('.');
      let updatedOptions = { ...options };
      let current = updatedOptions;

      keys.forEach((k, index) => {
        if (index === keys.length - 1) {
          current[k] = value;
        } else {
          current[k] = current[k] ? { ...current[k] } : {};
          current = current[k];
        }
      });

      return updatedOptions;
    });
  }, []);

  const actionButtons = (
    <Box display="flex" alignItems="center" gap={0}>
      <Tooltip title="Run Import">
        <span>
          <IconButton size="small" onClick={() => onClose(options)} disabled={options.backup === false} >
            <FileUploadOutlinedIcon />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Close">
        <IconButton size="small" onClick={onClose}>
          <DisabledByDefaultOutlinedIcon />
        </IconButton>
      </Tooltip>
    </Box >
  );

  return (
    <Dialog fullWidth open={open} onClose={() => onClose(null)}>
      <AppleDialogPanel
        title="Import options"
        subtitle="Backup and PIC Name person creation options."
        actions={actionButtons}
      >
          <Grid container spacing={1}>
            <OptionSwitch
              id="backup"
              checked={options.backup}
              handleChange={handleChange}
              label="I have a logbook backup"
            />
          </Grid>

          <Divider sx={{ m: 1 }} />
          <Typography variant="caption" color="warning">
            * Create Persons uses imported PIC Name values.
          </Typography>

          <Grid container spacing={1}>
            <OptionSwitch
              id="create_persons"
              checked={!!options.create_persons}
              handleChange={handleChange}
              label="Create Persons"
            />

            <Grid size={{ xs: 12 }}>
              <Box borderLeft={1} ml={3} p={1} borderColor="grey.200" >
                <Grid container spacing={1}>
                  <OptionSwitch
                    gsize={{ xs: 12, sm: 6 }}
                    id="create_person_from.pic"
                    checked={!!options.create_person_from?.pic}
                    handleChange={handleChange}
                    label={PICFieldName}
                    disabled={!options.create_persons}
                  />

                  <Grid size={{ xs: 12 }}>
                    <FormControlLabel
                      sx={{ m: 0, width: '100%', display: 'flex', justifyContent: 'space-between' }}
                      control={
                        <ToggleButtonGroup
                          size="small"
                          disabled={!options.create_persons}
                          value={options.create_person_format || 'fn_mn_ln'}
                          onChange={(_, value) => { if (value) handleChange('create_person_format', value) }}
                          exclusive
                        >
                          {TOGGLE_BUTTONS.map((toggle) => (
                            <Tooltip key={toggle.value} title={toggle.tooltip}>
                              <span>
                                <ToggleButton value={toggle.value}>
                                  {toggle.label}
                                </ToggleButton>
                              </span>
                            </Tooltip>
                          ))}
                        </ToggleButtonGroup>
                      }
                      label="Name Format"
                      labelPlacement="start"
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
      </AppleDialogPanel>
    </Dialog>
  )
}

export default ImportOptionsDialog;
