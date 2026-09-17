import { useEffect, useId, useMemo, useRef, useState } from 'react';

export const PageHead = ({ title, subtitle, actions }) => (
  <div className="page-head">
    <div>
      <h1 className="page-title">{title}</h1>
      {subtitle ? <p className="page-sub">{subtitle}</p> : null}
    </div>
    <span className="spacer" />
    {actions ? <div className="row exact-head-actions">{actions}</div> : null}
  </div>
);

export const Card = ({ title, subtitle, actions, children, className = '' }) => (
  <section className={`card panel ${className}`.trim()}>
    {(title || subtitle || actions) ? (
      <div className="row space exact-panel-head">
        <div>
          {title ? <div className="panel-title">{title}</div> : null}
          {subtitle ? <div className="panel-sub">{subtitle}</div> : null}
        </div>
        {actions ? <div className="row exact-panel-actions">{actions}</div> : null}
      </div>
    ) : null}
    {children}
  </section>
);

export const Field = ({ label, value = '', onChange, onBlur, onKeyDown, type = 'text', placeholder = '', disabled = false, readOnly = false, min, max, step, className = '', list, name }) => (
  <label className={`field ${className}`.trim()}>
    {label ? <span>{label}</span> : null}
    <input
      className="input"
      type={type}
      value={value ?? ''}
      name={name}
      onChange={(e) => onChange?.(e.target.value, e)}
      onBlur={(e) => onBlur?.(e.target.value, e)}
      onKeyDown={(e) => onKeyDown?.(e)}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      min={min}
      max={max}
      step={step}
      list={list}
    />
  </label>
);

export const TextArea = ({ label, value = '', onChange, placeholder = '', rows = 4, disabled = false }) => (
  <label className="field">
    {label ? <span>{label}</span> : null}
    <textarea className="textarea" rows={rows} value={value ?? ''} onChange={(e) => onChange?.(e.target.value, e)} placeholder={placeholder} disabled={disabled} />
  </label>
);

export const SelectField = ({ label, value = '', onChange, options = [], disabled = false, className = '' }) => (
  <label className={`field ${className}`.trim()}>
    {label ? <span>{label}</span> : null}
    <select className="select" value={value ?? ''} onChange={(e) => onChange?.(e.target.value, e)} disabled={disabled}>
      {options.map((option, index) => {
        const value = typeof option === 'object' ? option.value : option;
        const text = typeof option === 'object' ? option.label : option;
        return <option key={`${value}-${index}`} value={value}>{text}</option>;
      })}
    </select>
  </label>
);

const parseTimeParts = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return { hour: '', minute: '' };
  if (/^\d{4}$/.test(raw)) return { hour: raw.slice(0, 2), minute: raw.slice(2, 4) };
  const match = raw.match(/^(\d{1,3}):(\d{1,2})$/);
  if (match) return { hour: String(Number(match[1])).padStart(2, '0'), minute: match[2].padStart(2, '0') };
  return { hour: '', minute: '' };
};

const formatDisplayTime = (value, mode = 'duration') => {
  const parts = parseTimeParts(value);
  if (!parts.hour) return '';
  return mode === 'clock'
    ? `${parts.hour}:${(parts.minute || '00').padStart(2, '0')}`
    : `${String(Number(parts.hour))}:${(parts.minute || '00').padStart(2, '0')}`;
};

const normalizeTypedTime = (rawValue, mode = 'duration') => {
  const raw = String(rawValue ?? '').trim();
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  let hour = '';
  let minute = '';
  if (raw.includes(':')) {
    const [h = '', m = ''] = raw.split(':');
    hour = h.replace(/\D/g, '');
    minute = m.replace(/\D/g, '');
  } else if (digits.length === 4) {
    hour = digits.slice(0, 2);
    minute = digits.slice(2, 4);
  } else if (digits.length === 3) {
    hour = digits.slice(0, 1);
    minute = digits.slice(1, 3);
  } else {
    return null;
  }
  if (!hour || minute.length < 2) return null;
  const hourNumber = Number(hour);
  const minuteNumber = Number(minute);
  if (Number.isNaN(hourNumber) || Number.isNaN(minuteNumber) || minuteNumber > 59) return null;
  if (mode === 'clock' && hourNumber > 23) return null;
  return mode === 'clock'
    ? `${String(hourNumber).padStart(2, '0')}${String(minuteNumber).padStart(2, '0')}`
    : `${hourNumber}:${String(minuteNumber).padStart(2, '0')}`;
};

export const TimeSelectField = ({
  label,
  value = '',
  onChange,
  mode = 'duration',
  zeroAsEmpty = false,
  disabled = false,
  readOnly = false,
  quickFillValue = '',
  quickFillLabel = '',
  className = '',
}) => {
  const pickerInputRef = useRef(null);
  const textInputRef = useRef(null);
  const [draftValue, setDraftValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const isZeroDuration = (candidate) => {
    if (mode === 'clock' || !zeroAsEmpty) return false;
    if (candidate === 0) return true;
    const raw = String(candidate ?? '').trim();
    if (!raw) return false;
    const match = raw.match(/^(\d{1,3}):(\d{1,2})$/);
    return Boolean(match) && Number(match[1]) === 0 && Number(match[2]) === 0;
  };

  const normalizedValue = isZeroDuration(value) ? '' : String(value ?? '').trim();
  const parts = parseTimeParts(normalizedValue);
  const nativeValue = parts.hour && Number(parts.hour) <= 23 ? `${parts.hour}:${parts.minute || '00'}` : '';
  const formattedValue = formatDisplayTime(normalizedValue, mode);
  const visibleValue = isEditing ? draftValue : formattedValue;

  useEffect(() => {
    if (!isEditing) setDraftValue(formattedValue);
  }, [formattedValue, isEditing]);

  const emit = (nextValue, event) => {
    if (!nextValue) {
      onChange?.('', event);
      return;
    }
    if (isZeroDuration(nextValue)) {
      onChange?.('', event);
      return;
    }
    onChange?.(nextValue, event);
  };

  const commitDraft = (event) => {
    const normalized = normalizeTypedTime(draftValue, mode);
    setIsEditing(false);
    if (draftValue.trim() === '') {
      setDraftValue('');
      emit('', event);
      return;
    }
    if (normalized == null) {
      setDraftValue(formattedValue);
      return;
    }
    const nextDisplay = formatDisplayTime(normalized, mode);
    setDraftValue(nextDisplay);
    emit(normalized, event);
  };

  const openPicker = () => {
    if (disabled || readOnly) return;
    const input = pickerInputRef.current;
    if (!input) return;
    // Native time pickers default an empty control to the current system time.
    // Seed empty fields with midnight so the wheel/list always starts at 00:00.
    input.value = nativeValue || '00:00';
    input.focus({ preventScroll: true });
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
        return;
      } catch {
        // keep normal fallback
      }
    }
    input.click();
  };

  const openPickerFromSurround = (event) => {
    if (disabled || readOnly) return;
    if (event.target.closest('.exact-manual-time-input, .exact-time-quick-fill')) return;
    openPicker();
  };

  return (
    <div className={`field exact-time-field ${className}`.trim()}>
      {label ? <span>{label}</span> : null}
      <div
        className={`exact-native-time-row ${mode === 'clock' ? 'clock' : 'duration'}`}
        onClick={openPickerFromSurround}
        role="group"
        aria-label={label || 'Time'}
      >
        <span className="exact-time-edit-zone">
          <input
            ref={textInputRef}
            className="input exact-manual-time-input"
            type="text"
            inputMode="numeric"
            value={visibleValue}
            onFocus={() => {
              setIsEditing(true);
              setDraftValue(formattedValue);
            }}
            onChange={(event) => setDraftValue(event.target.value)}
            onBlur={commitDraft}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur();
              } else if (event.key === 'Escape') {
                setIsEditing(false);
                setDraftValue(formattedValue);
                event.currentTarget.blur();
              }
            }}
            placeholder="--:--"
            disabled={disabled}
            readOnly={readOnly}
            aria-label={label ? `${label} manual time entry` : 'Manual time entry'}
          />
          <input
            ref={pickerInputRef}
            className="exact-native-picker-input"
            type="time"
            step="60"
            value={nativeValue}
            onChange={(event) => emit(mode === 'clock'
              ? event.target.value.replace(':', '')
              : `${Number(event.target.value.split(':')[0])}:${event.target.value.split(':')[1]}`,
              event)}
            tabIndex={-1}
            aria-hidden="true"
            disabled={disabled}
            readOnly={readOnly}
          />
        </span>
        <span className="exact-time-picker-space" aria-hidden="true" />
        <span className="exact-time-picker-hint" aria-hidden="true">◷</span>
        {quickFillValue && !value ? (
          <button className="exact-time-quick-fill" type="button" onClick={() => onChange?.(quickFillValue)}>
            {quickFillLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
};

export const ComboField = ({ label, value = '', onChange, options = [], disabled = false, className = '', placeholder = '', id }) => {
  const generatedId = useId();
  const inputRef = useRef(null);
  const controlRef = useRef(null);
  const [open, setOpen] = useState(false);
  const current = String(value ?? '');
  const menuId = `${id || generatedId}-menu`;

  const normalized = useMemo(() => {
    const seen = new Set();
    return (Array.isArray(options) ? options : []).map((option) => {
      const optionValue = String(typeof option === 'object' ? option.value : option);
      const optionLabel = String(typeof option === 'object' ? (option.label ?? option.value) : option);
      return { value: optionValue, label: optionLabel };
    }).filter((option) => {
      if (!option.value || seen.has(option.value)) return false;
      seen.add(option.value);
      return true;
    });
  }, [options]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!controlRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        inputRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const toggleOptions = () => {
    if (disabled) return;
    setOpen((currentOpen) => !currentOpen);
  };

  const selectOption = (optionValue, event) => {
    onChange?.(optionValue, event);
    setOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <label className={`field exact-combo-field ${className}`.trim()}>
      {label ? <span>{label}</span> : null}
      <span ref={controlRef} className={`exact-combo-control${open ? ' open' : ''}`}>
        <input
          ref={inputRef}
          id={id}
          className="input exact-combo-input"
          value={current}
          onChange={(event) => onChange?.(event.target.value, event)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          aria-label={label || id || 'Selection'}
          aria-expanded={open}
          aria-controls={menuId}
          aria-autocomplete="list"
        />
        <button
          className="exact-combo-picker-button"
          type="button"
          tabIndex={0}
          disabled={disabled}
          onClick={toggleOptions}
          aria-label={label ? `Show ${label} options` : 'Show options'}
          aria-expanded={open}
          aria-controls={menuId}
        >
          <svg className="exact-combo-chevron" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {open ? (
          <span id={menuId} className="exact-combo-menu" role="listbox" aria-label={label ? `${label} options` : 'Options'}>
            {normalized.length ? normalized.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`exact-combo-option${option.value === current ? ' selected' : ''}`}
                role="option"
                aria-selected={option.value === current}
                onClick={(event) => selectOption(option.value, event)}
              >
                {option.label}
              </button>
            )) : <span className="exact-combo-empty">No saved options</span>}
          </span>
        ) : null}
      </span>
    </label>
  );
};

export const SwitchRow = ({ label, sub, checked = false, onChange, disabled = false }) => (
  <div className={`setting-row${disabled ? ' disabled' : ''}`}>
    <div>
      <div className="lbl">{label}</div>
      {sub ? <div className="sub">{sub}</div> : null}
    </div>
    <span className="spacer" />
    <button type="button" className={`switch${checked ? ' on' : ''}`} aria-pressed={checked} disabled={disabled} onClick={() => onChange?.(!checked)}><span className="sr-only">{label}</span></button>
  </div>
);

export const Chip = ({ kind = '', children }) => <span className={`chip ${kind}`.trim()}>{children}</span>;

export const Loading = ({ show = true }) => show ? <div className="exact-loading"><span /></div> : null;

export const EmptyState = ({ children = 'No data available' }) => <div className="exact-empty">{children}</div>;

export const Search = ({ value, onChange, placeholder = 'Search…' }) => (
  <div className="search"><span aria-hidden="true">⌕</span><input value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} /></div>
);

export const Modal = ({ open, title, children, onClose, actions, width = 680, showCloseButton = false, hideActions = false }) => {
  if (!open) return null;
  return (
    <div className="modal-backdrop show" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={{ maxWidth: width }}>
        <div className="modal-head">
          <span>{title}</span>
          {showCloseButton ? (
            <button className="modal-close-button" type="button" onClick={onClose} aria-label="Close">×</button>
          ) : null}
        </div>
        <div className="modal-body">{children}</div>
        {!hideActions ? <div className="modal-actions">{actions || <button className="btn" onClick={onClose}>Close</button>}</div> : null}
      </div>
    </div>
  );
};

const defaultCell = (row, col) => row?.[col.key];

export const NativeTable = ({ columns = [], rows = [], rowKey, onRowClick, actions, searchPlaceholder = 'Search…', searchable = true, loading = false, empty = 'No records found' }) => {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const list = Array.isArray(rows) ? rows : [];
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((row) => columns.some((col) => {
      const value = col.render ? col.searchValue?.(row) : defaultCell(row, col);
      return String(value ?? '').toLowerCase().includes(q);
    }));
  }, [columns, query, rows]);

  return (
    <>
      {(searchable || actions) ? <div className="toolbar exact-table-toolbar">{searchable ? <Search value={query} onChange={setQuery} placeholder={searchPlaceholder} /> : null}<span className="spacer" />{actions}</div> : null}
      <div className="table-wrap exact-native-table-wrap">
        <table>
          <thead><tr>{columns.map((col) => <th key={col.key} style={col.width ? { width: col.width } : undefined}>{col.label}</th>)}</tr></thead>
          <tbody>
            {!loading && filtered.map((row, index) => {
              const key = rowKey ? rowKey(row, index) : row?.uuid ?? row?.id ?? index;
              return (
                <tr key={key} onClick={() => onRowClick?.(row)} className={onRowClick ? 'clickable' : ''}>
                  {columns.map((col) => <td key={col.key}>{col.render ? col.render(row, index) : defaultCell(row, col)}</td>)}
                </tr>
              );
            })}
            {!loading && filtered.length === 0 ? <tr><td colSpan={columns.length}><EmptyState>{empty}</EmptyState></td></tr> : null}
          </tbody>
        </table>
      </div>
      {loading ? <Loading /> : null}
    </>
  );
};

export const setNested = (object, key, value) => {
  const parts = key.split('.');
  const next = { ...(object || {}) };
  let cursor = next;
  parts.forEach((part, index) => {
    if (index === parts.length - 1) cursor[part] = value;
    else {
      cursor[part] = { ...(cursor[part] || {}) };
      cursor = cursor[part];
    }
  });
  return next;
};

export const toInputDate = (value) => {
  if (!value) return '';
  const parts = String(value).split('/');
  if (parts.length === 3 && parts[2]?.length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  return value;
};

export const fromInputDate = (value) => {
  if (!value) return '';
  const [y, m, d] = String(value).split('-');
  return y && m && d ? `${d}/${m}/${y}` : value;
};

export const personName = (person) => {
  const value = person && typeof person === 'object' ? person : {};
  return [value.first_name, value.middle_name, value.last_name].filter(Boolean).join(' ') || 'Person';
};
