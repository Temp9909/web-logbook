import { useCallback, useMemo } from 'react';
import dayjs from 'dayjs';

const sizeClass = (gsize) => {
  if (!gsize || typeof gsize !== 'object') return 'apple-span-xs-12';
  return ['xs','sm','md','lg','xl']
    .map(bp => Number.isFinite(Number(gsize[bp])) ? `apple-span-${bp}-${Math.max(1, Math.min(12, Number(gsize[bp])))}` : '')
    .filter(Boolean)
    .join(' ');
};

export const DatePicker = ({ gsize, id, name = id, label, handleChange, tooltip = label, value, clearable, ...props }) => {
  const nativeValue = useMemo(() => {
    if (!value) return '';
    const d = dayjs(value);
    return d.isValid() ? d.format('YYYY-MM-DD') : '';
  }, [value]);

  const onDateChange = useCallback((event) => {
    const raw = event.target.value;
    handleChange?.(id, raw ? dayjs(raw, 'YYYY-MM-DD').format('DD/MM/YYYY') : '');
  }, [handleChange, id]);

  return (
    <label className={`apple-field ${sizeClass(gsize)}`} title={typeof tooltip === 'string' ? tooltip : undefined}>
      {label ? <span className="apple-field-label">{label}</span> : null}
      <input
        className="apple-field-control apple-date-control"
        type="date"
        id={id}
        name={name}
        value={nativeValue}
        onChange={onDateChange}
        min="1903-12-17"
        disabled={props.disabled}
        aria-label={typeof label === 'string' ? label : id}
      />
    </label>
  );
};

export default DatePicker;
