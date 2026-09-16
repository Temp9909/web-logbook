import Grid from "@mui/material/Grid";
import TextField from "../../UIElements/TextField";
import OptionSwitch from "../../UIElements/OptionSwitch";

export const LicensesExpiration = ({ settings = {}, handleChange }) => (
  <div className="apple-settings-subsection">
    <div className="apple-settings-subtitle">Licenses expiration</div>
    <Grid container spacing={1}>
      <TextField
        gsize={{ xs: 12, sm: 4 }}
        id="licenses_expiration.warning_period"
        label="Warning period (days)"
        handleChange={handleChange}
        value={settings?.licenses_expiration?.warning_period || 90}
        type="number"
        inputProps={{ min: 1 }}
      />
      <OptionSwitch
        gsize={{ xs: 6, sm: 4 }}
        id="licenses_expiration.show_warning"
        label="Show warning"
        checked={settings?.licenses_expiration?.show_warning ?? false}
        handleChange={handleChange}
      />
      <OptionSwitch
        gsize={{ xs: 6, sm: 4 }}
        id="licenses_expiration.show_expired"
        label="Show expired"
        checked={settings?.licenses_expiration?.show_expired ?? false}
        handleChange={handleChange}
      />
    </Grid>
  </div>
);

export default LicensesExpiration;
