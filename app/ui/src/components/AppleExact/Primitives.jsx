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
  const pickerRef = useRef(null);

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

  const displayValue = (() => {
    if (!normalizedValue) return '';
    if (mode === 'clock') {
      if (/^\d{4}$/.test(normalizedValue)) return `${normalizedValue.slice(0, 2)}:${normalizedValue.slice(2, 4)}`;
      const match = normalizedValue.match(/^(\d{1,2}):(\d{1,2})$/);
      if (match) return `${match[1].padStart(2, '0')}:${match[2].padStart(2, '0')}`;
      return normalizedValue;
    }
    const match = normalizedValue.match(/^(\d{1,3}):(\d{1,2})$/);
    if (match) return `${Number(match[1])}:${match[2].padStart(2, '0')}`;
    return normalizedValue;
  })();

  const [draft, setDraft] = useState(displayValue);
  useEffect(() => setDraft(displayValue), [displayValue]);

  const parseManualValue = (candidate) => {
    const raw = String(candidate ?? '').trim();
    if (!raw) return '';

    if (mode === 'clock') {
      const compact = raw.replace(/\s/g, '');
      let hour;
      let minute;
      const colonMatch = compact.match(/^(\d{1,2}):(\d{1,2})$/);
      if (colonMatch) {
        hour = Number(colonMatch[1]);
        minute = Number(colonMatch[2]);
      } else if (/^\d{3,4}$/.test(compact)) {
        hour = Number(compact.slice(0, -2));
        minute = Number(compact.slice(-2));
      } else {
        return null;
      }
      if (hour > 23 || minute > 59) return null;
      return `${String(hour).padStart(2, '0')}${String(minute).padStart(2, '0')}`;
    }

    const compact = raw.replace(/\s/g, '');
    let hour;
    let minute;
    const colonMatch = compact.match(/^(\d{1,3}):(\d{1,2})$/);
    if (colonMatch) {
      hour = Number(colonMatch[1]);
      minute = Number(colonMatch[2]);
    } else if (/^\d{3,5}$/.test(compact)) {
      hour = Number(compact.slice(0, -2));
      minute = Number(compact.slice(-2));
    } else {
      return null;
    }
    if (minute > 59) return null;
    const next = `${hour}:${String(minute).padStart(2, '0')}`;
    return isZeroDuration(next) ? '' : next;
  };

  const emitPickerValue = (nativeTime, event) => {
    if (!nativeTime) {
      setDraft('');
      onChange?.('', event);
      return;
    }
    const [hour, minute] = nativeTime.split(':');
    const nextValue = mode === 'clock' ? `${hour}${minute}` : `${Number(hour)}:${minute}`;
    if (isZeroDuration(nextValue)) {
      setDraft('');
      onChange?.('', event);
      return;
    }
    setDraft(mode === 'clock' ? `${hour}:${minute}` : `${Number(hour)}:${minute}`);
    onChange?.(nextValue, event);
  };

  const handleManualChange = (event) => {
    const nextDraft = event.target.value.replace(/[^0-9:]/g, '');
    setDraft(nextDraft);
    const parsed = parseManualValue(nextDraft);
    if (parsed !== null) onChange?.(parsed, event);
  };

  const commitManualValue = (event) => {
    const parsed = parseManualValue(draft);
    if (parsed === null) {
      setDraft(displayValue);
      return;
    }
    if (!parsed) {
      setDraft('');
      onChange?.('', event);
      return;
    }
    const committedDisplay = mode === 'clock'
      ? `${parsed.slice(0, 2)}:${parsed.slice(2, 4)}`
      : parsed;
    setDraft(committedDisplay);
    onChange?.(parsed, event);
  };

  const openPicker = () => {
    if (disabled || readOnly) return;
    const input = pickerRef.current;
    if (!input) return;
    input.focus({ preventScroll: true });
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
        return;
      } catch {
        // Fall through to the native click fallback when showPicker is unavailable.
      }
    }
    input.click();
  };

  const openPickerFromSurround = (event) => {
    if (disabled || readOnly) return;
    if (event.target.closest('.exact-time-manual-input, .exact-time-quick-fill')) return;
    openPicker();
  };

  return (
    <div className={`field exact-time-field ${className}`.trim()}>
      {label ? <span>{label}</span> : null}
      <div
        className={`exact-native-time-row${mode === 'clock' ? ' clock' : ''}`}
        onClick={openPickerFromSurround}
        role="group"
        aria-label={label || 'Time'}
      >
        <input
          className="input exact-time-manual-input"
          type="text"
          inputMode="numeric"
          value={draft}
          onChange={handleManualChange}
          onBlur={commitManualValue}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              commitManualValue(event);
              event.currentTarget.blur();
            }
          }}
          placeholder="--:--"
          disabled={disabled}
          readOnly={readOnly}
          aria-label={label ? `${label} manual entry` : 'Manual time entry'}
          autoComplete="off"
        />
        <span className="exact-time-picker-space" aria-hidden="true" />
        <span className="exact-time-picker-hint" aria-hidden="true">◷</span>
        <input
          ref={pickerRef}
          className="exact-native-time-picker"
          type="time"
          step="60"
          value={nativeValue}
          onChange={(event) => emitPickerValue(event.target.value, event)}
          disabled={disabled}
          readOnly={readOnly}
          tabIndex={-1}
          aria-label={label ? `${label} picker` : 'Time picker'}
        />
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
  const normalized = Array.isArray(options) ? options : [];
  const current = String(value ?? '');
  const listId = `${id || generatedId}-options`;

  const openOptions = () => {
    if (disabled) return;
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
      } catch {
        // Browsers without a programmatic datalist picker still show suggestions while typing.
      }
    }
  };

  return (
    <label className={`field exact-combo-field ${className}`.trim()}>
      {label ? <span>{label}</span> : null}
      <span className="exact-combo-control">
        <input
          ref={inputRef}
          id={id}
          className="input exact-combo-input"
          list={listId}
          value={current}
          onChange={(event) => onChange?.(event.target.value, event)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          aria-label={label || id || 'Selection'}
        />
        <button
          className="exact-combo-picker-button"
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={openOptions}
          aria-label={label ? `Show ${label} options` : 'Show options'}
        >
          <span aria-hidden="true">⌄</span>
        </button>
      </span>
      <datalist id={listId}>
        {normalized.map((option, index) => {
          const optionValue = String(typeof option === 'object' ? option.value : option);
          const optionLabel = String(typeof option === 'object' ? (option.label ?? option.value) : option);
          return <option key={`${optionValue}-${index}`} value={optionValue}>{optionLabel}</option>;
        })}
      </datalist>
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
