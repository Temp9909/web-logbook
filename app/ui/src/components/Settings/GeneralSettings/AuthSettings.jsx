import Grid from "@mui/material/Grid";
import TextField from "../../UIElements/TextField";
import OptionSwitch from "../../UIElements/OptionSwitch";

export const AuthSettings = ({ settings = {}, handleChange }) => (
  <>
    <OptionSwitch
      id="auth_enabled"
      label="Enable Authentication"
      checked={settings?.auth_enabled ?? false}
      handleChange={(_, checked) => handleChange("auth_enabled", checked)}
    />
    <Grid container spacing={1}>
      <TextField gsize={{ xs: 12, sm: 6 }} id="login" label="Login" handleChange={handleChange} value={settings.login ?? ""} disabled={!settings.auth_enabled} />
      <TextField gsize={{ xs: 12, sm: 6 }} id="password" label="Password" handleChange={handleChange} value={settings.password ?? ""} disabled={!settings.auth_enabled} type="password" />
    </Grid>
  </>
);

export default AuthSettings;
