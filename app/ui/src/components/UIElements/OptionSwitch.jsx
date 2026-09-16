const sizeClass = (gsize) => {
  if (!gsize || typeof gsize !== 'object') return 'apple-span-xs-12';
  return ['xs','sm','md','lg','xl']
    .map(bp => Number.isFinite(Number(gsize[bp])) ? `apple-span-${bp}-${Math.max(1, Math.min(12, Number(gsize[bp])))}` : '')
    .filter(Boolean)
    .join(' ');
};

const OptionSwitch = ({ id, gsize = { xs: 12 }, label, checked, disabled = false, handleChange }) => (
  <label className={`apple-option-row ${sizeClass(gsize)}${disabled ? ' disabled' : ''}`} htmlFor={id}>
    <span className="apple-option-label">{label}</span>
    <span className={`apple-switch-control${checked ? ' on' : ''}`}>
      <input
        id={id}
        type="checkbox"
        checked={Boolean(checked)}
        disabled={disabled}
        onChange={(event) => handleChange?.(id, event.target.checked)}
      />
      <span className="apple-switch-knob" />
    </span>
  </label>
);

export default OptionSwitch;
