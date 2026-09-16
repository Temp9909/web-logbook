import { useCallback } from "react";
import Grid from "@mui/material/Grid";
import TextField from "../../UIElements/TextField";

const SegmentedSetting = ({ label, value, options, onChange }) => (
  <div className="apple-settings-row">
    <span className="apple-settings-row-label">{label}</span>
    <div className="segmented">
      {options.map((option) => (
        <button key={option.value} type="button" className={Number(value) === option.value ? 'on' : ''} onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  </div>
);

export const OtherSettings = ({ settings = {}, handleChange }) => {
  const getDefaultPagination = useCallback(() => settings.logbook_pagination?.trim() || "5, 10, 15, 20, 25, 30, 50, 100", [settings.logbook_pagination]);

  return (
    <>
      <Grid container spacing={1}>
        <TextField gsize={{ xs: 12, sm: 6 }} id="logbook_pagination" label="Logbook Pagination" handleChange={handleChange} value={getDefaultPagination()} />
        <TextField gsize={{ xs: 12, sm: 6 }} id="self_pic_label" label="Self PIC Label" handleChange={handleChange} value={settings.self_pic_label || "Self"} />
      </Grid>
      <div className="apple-settings-choice-list">
        <SegmentedSetting
          label="Logbook table time fields autoformat"
          value={parseInt(settings.time_fields_auto_format) || 0}
          onChange={(value) => handleChange('time_fields_auto_format', value)}
          options={[{ value: 0, label: 'None' }, { value: 1, label: 'HH:MM' }, { value: 2, label: 'H:MM' }]}
        />
        <SegmentedSetting
          label="Logbook table totals view"
          value={parseInt(settings.logbook_totals_view) || 0}
          onChange={(value) => handleChange('logbook_totals_view', value)}
          options={[{ value: 0, label: 'Standard' }, { value: 1, label: 'Paper Logbook' }]}
        />
      </div>
    </>
  );
};

export default OtherSettings;
