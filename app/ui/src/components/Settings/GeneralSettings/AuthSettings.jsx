import { useCallback } from "react";
import Grid from "@mui/material/Grid";
import TextField from "../../UIElements/TextField";
import OptionSwitch from "../../UIElements/OptionSwitch";

export const AuthSettings = ({ settings = {}, handleChange }) => {
  const onAuthToggle = useCallback((enabled) => {
    handleChange("auth_enabled", enabled);
    if (enabled) {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      const base64Key = btoa(String.fromCharCode.apply(null, array));
      handleChange("secret_key", base64Key);
    }
  }, [handleChange]);

  return (
    <>
      <OptionSwitch
        id="auth_enabled"
        label="Enable Authentication"
        checked={settings?.auth_enabled ?? false}
        handleChange={(_, checked) => onAuthToggle(checked)}
      />
      <Grid container spacing={1}>
        <TextField gsize={{ xs: 12, sm: 6 }} id="login" label="Login" handleChange={handleChange} value={settings.login ?? ""} disabled={!settings.auth_enabled} />
        <TextField gsize={{ xs: 12, sm: 6 }} id="password" label="Password" handleChange={handleChange} value={settings.password ?? ""} disabled={!settings.auth_enabled} type="password" />
        <TextField gsize={{ xs: 12 }} id="secret_key" label="Secret Key" handleChange={handleChange} value={settings.secret_key ?? ""} disabled={!settings.auth_enabled} />
      </Grid>
    </>
  );
};

export default AuthSettings;
