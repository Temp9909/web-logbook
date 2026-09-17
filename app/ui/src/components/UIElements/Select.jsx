import { useCallback, useEffect, useMemo, useState } from 'react';

const sizeClass = (gsize) => {
  if (gsize === 'grow') return 'apple-field-grow';
  if (!gsize || typeof gsize !== 'object') return 'apple-span-xs-12';
  const parts = [];
  for (const bp of ['xs','sm','md','lg','xl']) {
    const value = gsize[bp];
    if (value === 'grow') parts.push(`apple-span-${bp}-grow`);
    else if (Number.isFinite(Number(value))) parts.push(`apple-span-${bp}-${Math.max(1, Math.min(12, Number(value)))}`);
  }
  return parts.join(' ') || 'apple-span-xs-12';
};

const optionLabel = (option) => {
  if (option == null) return '';
  if (typeof option === 'object') return String(option.label ?? option.name ?? option.id ?? '');
  return String(option);
};

export const Select = ({
  gsize,
  id,
  name = id,
  label,
  handleChange,
  onChange,
  options = [],
  multiple = false,
  freeSolo = false,
  value,
  defaultValue,
  inputValue,
  onInputChange,
  onBlur,
  onDoubleClick,
  tooltip,
  disabled,
  disableClearable = true,
  className = '',
  ...props
}) => {
  const normalized = useMemo(() => Array.isArray(options) ? options : [], [options]);
  const externalDisplay = useMemo(() => {
    if (multiple) {
      if (Array.isArray(value)) return value.map(optionLabel).join(', ');
      return value ?? '';
    }
    if (inputValue !== undefined) return inputValue ?? '';
    return optionLabel(value !== undefined ? value : defaultValue);
  }, [defaultValue, inputValue, multiple, value]);
  const [draft, setDraft] = useState(externalDisplay);

  useEffect(() => {
    setDraft(externalDisplay);
  }, [externalDisplay]);

  const resolveSingle = useCallback((raw) => {
    if (raw === '') return '';
    const match = normalized.find((option) => optionLabel(option) === raw);
    return match !== undefined ? match : raw;
  }, [normalized]);

  const handleSingleChange = useCallback((event) => {
    const raw = event.target.value;
    setDraft(raw);
    const resolved = resolveSingle(raw);
    handleChange?.(name, resolved);
    onChange?.(event, resolved);
    onInputChange?.(event, raw);
  }, [handleChange, name, onChange, onInputChange, resolveSingle]);

  const handleInput = useCallback((event) => {
    const raw = event.target.value;
    setDraft(raw);
    onInputChange?.(event, raw);
    const values = raw.split(',').map(v => v.trim()).filter(Boolean);
    const resolved = values.join(', ');
    handleChange?.(name, resolved);
    onChange?.(event, values);
  }, [handleChange, name, onChange, onInputChange]);

  const singleOptions = useMemo(() => {
    const result = [...normalized];
    if (draft && !result.some((option) => optionLabel(option) === draft)) result.unshift(draft);
    return result;
  }, [draft, normalized]);

  if (!multiple) {
    return (
      <label className={`apple-field apple-select-field ${sizeClass(gsize)} ${className}`.trim()} title={typeof tooltip === 'string' ? tooltip : undefined}>
        {label ? <span className="apple-field-label">{label}</span> : null}
        <select
          id={id}
          name={name}
          className="select apple-field-control apple-native-select-control"
          value={draft ?? ''}
          onChange={handleSingleChange}
          onBlur={onBlur}
          onDoubleClick={onDoubleClick}
          disabled={disabled}
          aria-label={typeof label === 'string' ? label : id}
        >
          {!disableClearable ? <option value="">—</option> : null}
          {singleOptions.map((option, index) => {
            const text = optionLabel(option);
            return <option key={`${text}-${index}`} value={text}>{text}</option>;
          })}
        </select>
      </label>
    );
  }

  const listId = `${id}-apple-options`;
  return (
    <label className={`apple-field apple-select-field ${sizeClass(gsize)} ${className}`.trim()} title={typeof tooltip === 'string' ? tooltip : undefined}>
      {label ? <span className="apple-field-label">{label}</span> : null}
      <span className="apple-select-wrap">
        <input
          id={id}
          name={name}
          className="input apple-field-control apple-select-control"
          list={listId}
          value={draft}
          onChange={handleInput}
          onBlur={onBlur}
          onDoubleClick={onDoubleClick}
          disabled={disabled}
          autoComplete="off"
          aria-label={typeof label === 'string' ? label : id}
          placeholder={props.placeholder}
        />
        <span className="apple-select-caret" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>
      <datalist id={listId}>
        {normalized.map((option, index) => <option key={`${optionLabel(option)}-${index}`} value={optionLabel(option)} />)}
      </datalist>
    </label>
  );
};

export default Select;
