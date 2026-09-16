import { useEffect, useMemo, useState } from 'react';

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

export const Field = ({ label, value = '', onChange, type = 'text', placeholder = '', disabled = false, readOnly = false, min, max, step, className = '', list, name }) => (
  <label className={`field ${className}`.trim()}>
    {label ? <span>{label}</span> : null}
    <input
      className="input"
      type={type}
      value={value ?? ''}
      name={name}
      onChange={(e) => onChange?.(e.target.value, e)}
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

const minuteOptions = Array.from({ length: 60 }, (_, value) => String(value).padStart(2, '0'));

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
  maxHours = 24,
  zeroAsEmpty = false,
  disabled = false,
  className = '',
}) => {
  const isZeroDuration = (candidate) => {
    if (mode === 'clock' || !zeroAsEmpty) return false;
    if (candidate === 0) return true;
    const raw = String(candidate ?? '').trim();
    if (!raw) return false;
    const match = raw.match(/^(\d{1,3}):(\d{1,2})$/);
    return Boolean(match) && Number(match[1]) === 0 && Number(match[2]) === 0;
  };

  const externalParts = parseTimeParts(isZeroDuration(value) ? '' : value);
  const [draft, setDraft] = useState(externalParts);
  useEffect(() => {
    setDraft(externalParts);
  }, [value, mode, zeroAsEmpty]);

  const hourLimit = mode === 'clock' ? 23 : Math.max(0, Number(maxHours) || 24);
  const hourOptions = Array.from({ length: hourLimit + 1 }, (_, hour) => String(hour).padStart(2, '0'));

  const emit = (nextHour, nextMinute, event) => {
    const nextDraft = { hour: nextHour, minute: nextMinute };
    setDraft(nextDraft);
    if (!nextHour && !nextMinute) {
      onChange?.('', event);
      return;
    }
    const hour = nextHour || '00';
    const minute = nextMinute || '00';
    const nextValue = mode === 'clock' ? `${hour}${minute}` : `${Number(hour)}:${minute}`;
    if (isZeroDuration(nextValue)) {
      if (nextHour && nextMinute) setDraft({ hour: '', minute: '' });
      onChange?.('', event);
      return;
    }
    onChange?.(nextValue, event);
  };

  return (
    <label className={`field exact-time-field ${className}`.trim()}>
      {label ? <span>{label}</span> : null}
      <span className="exact-time-picker">
        <select
          className="select exact-time-part"
          value={draft.hour}
          onChange={(e) => emit(e.target.value, draft.minute, e)}
          disabled={disabled}
          aria-label={`${label || 'Time'} hours`}
        >
          <option value="">--</option>
          {hourOptions.map((hour) => <option key={hour} value={hour}>{hour}</option>)}
        </select>
        <span className="exact-time-colon" aria-hidden="true">:</span>
        <select
          className="select exact-time-part"
          value={draft.minute}
          onChange={(e) => emit(draft.hour, e.target.value, e)}
          disabled={disabled}
          aria-label={`${label || 'Time'} minutes`}
        >
          <option value="">--</option>
          {minuteOptions.map((minute) => <option key={minute} value={minute}>{minute}</option>)}
        </select>
      </span>
    </label>
  );
};

export const ComboField = ({ label, value = '', onChange, options = [], disabled = false, className = '', placeholder = '' }) => {
  const normalized = Array.isArray(options) ? options : [];
  const current = String(value ?? '');
  const hasCurrent = normalized.some((option) => String(typeof option === 'object' ? option.value : option) === current);
  const selectOptions = [
    ...(placeholder ? [{ value:'', label:placeholder }] : []),
    ...(!hasCurrent && current ? [{ value:current, label:current }] : []),
    ...normalized,
  ];
  return <SelectField label={label} value={current} onChange={onChange} options={selectOptions} disabled={disabled} className={className} />;
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

export const Modal = ({ open, title, children, onClose, actions, width = 680 }) => {
  if (!open) return null;
  return (
    <div className="modal-backdrop show" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={{ maxWidth: width }}>
        <div className="modal-head">{title}</div>
        <div className="modal-body">{children}</div>
        <div className="modal-actions">{actions || <button className="btn" onClick={onClose}>Close</button>}</div>
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
