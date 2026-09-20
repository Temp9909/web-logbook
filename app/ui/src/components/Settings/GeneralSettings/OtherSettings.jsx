import Grid from "@mui/material/Grid";
import TextField from "../../UIElements/TextField";

export const OtherSettings = ({ settings = {}, handleChange }) => (
  <Grid container spacing={1}>
    <TextField gsize={{ xs: 12, sm: 6 }} id="self_pic_label" label="Self PIC Label" handleChange={handleChange} value={settings.self_pic_label || "Self"} />
  </Grid>
);

export default OtherSettings;
