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
  className = '',
  ...props
}) => {
  const normalized = useMemo(() => Array.isArray(options) ? options : [], [options]);
  const listId = `${id}-apple-options`;
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

  const handleInput = useCallback((event) => {
    const raw = event.target.value;
    setDraft(raw);
    onInputChange?.(event, raw);

    if (multiple) {
      const values = raw.split(',').map(v => v.trim()).filter(Boolean);
      const resolved = values.join(', ');
      handleChange?.(name, resolved);
      onChange?.(event, values);
      return;
    }

    const match = normalized.find((option) => optionLabel(option) === raw);
    if (match !== undefined) {
      handleChange?.(name, match);
      onChange?.(event, match);
    } else if (freeSolo) {
      handleChange?.(name, raw);
      onChange?.(event, raw);
    }
  }, [freeSolo, handleChange, multiple, name, normalized, onChange, onInputChange]);

  const handleBlur = useCallback((event) => {
    if (!multiple && !freeSolo) {
      const match = normalized.find((option) => optionLabel(option) === event.target.value);
      if (match !== undefined) handleChange?.(name, match);
      else setDraft(externalDisplay);
    }
    onBlur?.(event);
  }, [externalDisplay, freeSolo, handleChange, multiple, name, normalized, onBlur]);

  return (
    <label className={`apple-field apple-select-field ${sizeClass(gsize)} ${className}`.trim()} title={typeof tooltip === 'string' ? tooltip : undefined}>
      {label ? <span className="apple-field-label">{label}</span> : null}
      <span className="apple-select-wrap">
        <input
          id={id}
          name={name}
          className="apple-field-control apple-select-control"
          list={listId}
          value={draft}
          onChange={handleInput}
          onBlur={handleBlur}
          onDoubleClick={onDoubleClick}
          disabled={disabled}
          autoComplete="off"
          aria-label={typeof label === 'string' ? label : id}
          placeholder={props.placeholder}
        />
        <span className="apple-select-caret" aria-hidden="true">⌄</span>
      </span>
      <datalist id={listId}>
        {normalized.map((option, index) => (
          <option key={`${optionLabel(option)}-${index}`} value={optionLabel(option)} />
        ))}
      </datalist>
    </label>
  );
};

export default Select;
