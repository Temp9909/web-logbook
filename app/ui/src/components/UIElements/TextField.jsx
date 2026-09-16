import { useCallback, useMemo } from 'react';

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

const plainLabel = (label, fallback) => typeof label === 'string' ? label : fallback;

export const TextField = ({
  gsize,
  id,
  name = id,
  label,
  handleChange,
  tooltip = label,
  multiline = false,
  rows = 3,
  slotProps,
  sx,
  fullWidth,
  variant,
  size,
  InputProps,
  inputProps,
  onChange,
  value = '',
  className = '',
  ...props
}) => {
  const handleTextFieldChange = useCallback((event) => {
    handleChange?.(id, event.target.value);
    onChange?.(event);
  }, [id, handleChange, onChange]);

  const htmlInputProps = useMemo(() => ({
    ...(slotProps?.htmlInput || {}),
    ...(inputProps || {}),
  }), [slotProps, inputProps]);

  const commonProps = {
    id,
    name,
    value: value ?? '',
    onChange: handleTextFieldChange,
    placeholder: props.placeholder,
    disabled: props.disabled,
    required: props.required,
    readOnly: props.readOnly ?? htmlInputProps.readOnly,
    autoFocus: props.autoFocus,
    autoComplete: props.autoComplete,
    min: props.min ?? htmlInputProps.min,
    max: props.max ?? htmlInputProps.max,
    step: props.step ?? htmlInputProps.step,
    inputMode: htmlInputProps.inputMode,
    pattern: htmlInputProps.pattern,
    maxLength: htmlInputProps.maxLength,
    onInput: htmlInputProps.onInput,
    style: htmlInputProps.style,
    onBlur: props.onBlur,
    onFocus: props.onFocus,
    onDoubleClick: props.onDoubleClick,
    'aria-label': props['aria-label'] || plainLabel(label, id),
  };

  const title = typeof tooltip === 'string' ? tooltip : undefined;

  return (
    <label className={`apple-field ${sizeClass(gsize)} ${className}`.trim()} title={title}>
      {label ? <span className="apple-field-label">{label}</span> : null}
      {multiline ? (
        <textarea className="apple-field-control apple-field-textarea" rows={rows} {...commonProps} />
      ) : (
        <input className="apple-field-control" type={props.type || 'text'} {...commonProps} />
      )}
    </label>
  );
};

export default TextField;
