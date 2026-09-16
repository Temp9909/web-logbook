import OptionSwitch from "../UIElements/OptionSwitch";

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

export const OtherSettings = ({ pdfSettings = {}, handleChange }) => (
  <div className="apple-settings-choice-list">
    <OptionSwitch
      id="replace_sp_time"
      checked={pdfSettings.replace_sp_time ?? false}
      handleChange={handleChange}
      label='Replace SE and ME values for single pilot time with "✓" symbol (Part FCL.050 format)'
    />
    <OptionSwitch
      id="include_signature"
      checked={pdfSettings.include_signature ?? false}
      handleChange={handleChange}
      label="Include signature"
    />
    <OptionSwitch
      id="is_extended"
      checked={pdfSettings.is_extended ?? false}
      handleChange={handleChange}
      label="Extended Part FCL.050 format"
    />
    <SegmentedSetting
      label="Time fields autoformat"
      value={parseInt(pdfSettings.time_fields_auto_format) || 0}
      onChange={(value) => handleChange('time_fields_auto_format', value)}
      options={[{ value: 0, label: 'None' }, { value: 1, label: 'HH:MM' }, { value: 2, label: 'H:MM' }]}
    />
  </div>
);

export default OtherSettings;
