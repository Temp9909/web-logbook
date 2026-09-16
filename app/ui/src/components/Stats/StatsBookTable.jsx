import { useMemo, useState } from 'react';
import { convertMinutesToTime, convertTimeToMinutes, getCustomFieldValue } from '../../util/helpers';
import { Search } from '../AppleExact/Primitives';

const formatTime = (value) => {
  if (value === undefined || value === null || value === '' || value === 0 || value === '00:00') return '—';
  if (typeof value === 'number') return convertMinutesToTime(value);
  return String(value);
};
const dashNumber = (value) => (Number(value || 0) === 0 ? '—' : Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 }));
const dashValue = (value) => {
  if (value === undefined || value === null || value === '' || value === 0 || value === '00:00') return '—';
  return typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(value);
};

const addTime = (rows, path) => rows.reduce((sum, row) => {
  const value = path.split('.').reduce((current, key) => current?.[key], row);
  return sum + convertTimeToMinutes(value);
}, 0);

const addNumber = (rows, path) => rows.reduce((sum, row) => {
  const value = path.split('.').reduce((current, key) => current?.[key], row);
  return sum + (Number(value) || 0);
}, 0);

const csvEscape = (value) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const downloadCsv = (filename, headers, rows) => {
  const csv = [headers, ...rows].map((line) => line.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
};

const customValue = (row, field) => getCustomFieldValue(row?.custom_fields?.[field.uuid], field);

const combinedCustomValue = (rows, field) => {
  const aggregate = rows.reduce((result, row) => {
    const item = row?.custom_fields?.[field.uuid];
    if (item) {
      result.sum += Number(item.sum) || 0;
      result.count += Number(item.count) || 0;
    }
    return result;
  }, { sum: 0, count: 0 });
  return getCustomFieldValue(aggregate, field);
};

export const StatsBookTable = ({
  rows = [],
  groupLabel = 'Group',
  groupValue = (row) => row?.model || '',
  customFields = [],
  fieldName = (key) => key,
  exportFilename = 'stats.csv',
  showTotals = false,
  loading = false,
}) => {
  const [query, setQuery] = useState('');
  const statsFields = useMemo(
    () => (Array.isArray(customFields) ? customFields.filter((field) => field?.stats_function !== 'none') : []),
    [customFields],
  );

  const filtered = useMemo(() => {
    const list = Array.isArray(rows) ? rows : [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((row) => String(groupValue(row) ?? '').toLowerCase().includes(q));
  }, [groupValue, query, rows]);

  const headers = useMemo(() => [
    groupLabel,
    fieldName('se'), fieldName('me'), fieldName('mcc'),
    fieldName('night'), fieldName('ifr'),
    fieldName('pic'), fieldName('cop'), fieldName('dual'), fieldName('instr'),
    'CC', `${fieldName('fstd')} ${fieldName('sim_time')}`,
    `${fieldName('land_day')} ${fieldName('landings')}`, `${fieldName('land_night')} ${fieldName('landings')}`,
    'Distance',
    ...statsFields.map((field) => field.name),
    fieldName('total'),
  ], [fieldName, groupLabel, statsFields]);

  const csvRows = useMemo(() => filtered.map((row) => [
    groupValue(row),
    formatTime(row?.time?.se_time) === '—' ? '00:00' : formatTime(row?.time?.se_time), formatTime(row?.time?.me_time) === '—' ? '00:00' : formatTime(row?.time?.me_time), formatTime(row?.time?.mcc_time) === '—' ? '00:00' : formatTime(row?.time?.mcc_time),
    formatTime(row?.time?.night_time) === '—' ? '00:00' : formatTime(row?.time?.night_time), formatTime(row?.time?.ifr_time) === '—' ? '00:00' : formatTime(row?.time?.ifr_time),
    formatTime(row?.time?.pic_time) === '—' ? '00:00' : formatTime(row?.time?.pic_time), formatTime(row?.time?.co_pilot_time) === '—' ? '00:00' : formatTime(row?.time?.co_pilot_time), formatTime(row?.time?.dual_time) === '—' ? '00:00' : formatTime(row?.time?.dual_time), formatTime(row?.time?.instructor_time) === '—' ? '00:00' : formatTime(row?.time?.instructor_time),
    formatTime(row?.time?.cc_time) === '—' ? '00:00' : formatTime(row?.time?.cc_time), formatTime(row?.sim?.time) === '—' ? '00:00' : formatTime(row?.sim?.time),
    row?.landings?.day || 0, row?.landings?.night || 0,
    Number(row?.distance || 0).toFixed(0),
    ...statsFields.map((field) => customValue(row, field)),
    formatTime(row?.time?.total_time) === '—' ? '00:00' : formatTime(row?.time?.total_time),
  ]), [filtered, groupValue, statsFields]);

  const totalRow = useMemo(() => showTotals ? {
    se: convertMinutesToTime(addTime(filtered, 'time.se_time')),
    me: convertMinutesToTime(addTime(filtered, 'time.me_time')),
    mcc: convertMinutesToTime(addTime(filtered, 'time.mcc_time')),
    night: convertMinutesToTime(addTime(filtered, 'time.night_time')),
    ifr: convertMinutesToTime(addTime(filtered, 'time.ifr_time')),
    pic: convertMinutesToTime(addTime(filtered, 'time.pic_time')),
    cop: convertMinutesToTime(addTime(filtered, 'time.co_pilot_time')),
    dual: convertMinutesToTime(addTime(filtered, 'time.dual_time')),
    instr: convertMinutesToTime(addTime(filtered, 'time.instructor_time')),
    cc: convertMinutesToTime(addTime(filtered, 'time.cc_time')),
    sim: convertMinutesToTime(addTime(filtered, 'sim.time')),
    landDay: addNumber(filtered, 'landings.day'),
    landNight: addNumber(filtered, 'landings.night'),
    distance: addNumber(filtered, 'distance'),
    custom: statsFields.map((field) => combinedCustomValue(filtered, field)),
    total: convertMinutesToTime(addTime(filtered, 'time.total_time')),
  } : null, [filtered, showTotals, statsFields]);

  return <>
    <div className="toolbar exact-stats-toolbar">
      <Search value={query} onChange={setQuery} placeholder={`Search ${groupLabel.toLowerCase()}…`} />
      <span className="spacer" />
      <button className="btn ghost" type="button" onClick={() => downloadCsv(exportFilename, headers, csvRows)}>Export CSV</button>
    </div>
    <div className="card table-wrap exact-stats-book-wrap">
      <table className="easa apple-logbook-table exact-stats-book-table">
        <thead>
          <tr className="grp">
            <th rowSpan="2">{groupLabel}</th>
            <th colSpan="2">Single Pilot Time</th>
            <th rowSpan="2">Multi<br/>Pilot</th>
            <th colSpan="2">Operational<br/>Condition</th>
            <th colSpan="4">Pilot Function Time</th>
            <th rowSpan="2">Cross<br/>Country</th>
            <th rowSpan="2">FSTD<br/>Time</th>
            <th colSpan="2">Landings</th>
            <th rowSpan="2">Distance</th>
            {statsFields.length ? <th colSpan={statsFields.length}>Custom fields</th> : null}
            <th rowSpan="2">Total<br/>Time</th>
          </tr>
          <tr className="sub">
            <th>{fieldName('se')}</th><th>{fieldName('me')}</th>
            <th>{fieldName('night')}</th><th>{fieldName('ifr')}</th>
            <th>{fieldName('pic')}</th><th>{fieldName('cop')}</th><th>{fieldName('dual')}</th><th>{fieldName('instr')}</th>
            <th>{fieldName('land_day')}</th><th>{fieldName('land_night')}</th>
            {statsFields.map((field) => <th key={field.uuid}>{field.name}</th>)}
          </tr>
        </thead>
        <tbody>
          {!loading && filtered.map((row, index) => <tr key={`${groupValue(row)}-${index}`}>
            <td className="exact-stats-group-cell">{groupValue(row)}</td>
            <td className="mono">{formatTime(row?.time?.se_time)}</td>
            <td className="mono">{formatTime(row?.time?.me_time)}</td>
            <td className="mono">{formatTime(row?.time?.mcc_time)}</td>
            <td className="mono">{formatTime(row?.time?.night_time)}</td>
            <td className="mono">{formatTime(row?.time?.ifr_time)}</td>
            <td className="mono">{formatTime(row?.time?.pic_time)}</td>
            <td className="mono">{formatTime(row?.time?.co_pilot_time)}</td>
            <td className="mono">{formatTime(row?.time?.dual_time)}</td>
            <td className="mono">{formatTime(row?.time?.instructor_time)}</td>
            <td className="mono">{formatTime(row?.time?.cc_time)}</td>
            <td className="mono">{formatTime(row?.sim?.time)}</td>
            <td className="mono">{dashNumber(row?.landings?.day)}</td>
            <td className="mono">{dashNumber(row?.landings?.night)}</td>
            <td className="mono">{dashNumber(row?.distance)}</td>
            {statsFields.map((field) => <td className="mono" key={field.uuid}>{dashValue(customValue(row, field))}</td>)}
            <td className="mono exact-stats-total-cell">{formatTime(row?.time?.total_time)}</td>
          </tr>)}
          {!loading && filtered.length === 0 ? <tr><td colSpan={16 + statsFields.length} className="muted exact-stats-empty">No statistics found.</td></tr> : null}
        </tbody>
        {totalRow ? <tfoot><tr>
          <td>Total</td>
          <td className="mono">{formatTime(totalRow.se)}</td><td className="mono">{formatTime(totalRow.me)}</td><td className="mono">{formatTime(totalRow.mcc)}</td>
          <td className="mono">{formatTime(totalRow.night)}</td><td className="mono">{formatTime(totalRow.ifr)}</td>
          <td className="mono">{formatTime(totalRow.pic)}</td><td className="mono">{formatTime(totalRow.cop)}</td><td className="mono">{formatTime(totalRow.dual)}</td><td className="mono">{formatTime(totalRow.instr)}</td>
          <td className="mono">{formatTime(totalRow.cc)}</td><td className="mono">{formatTime(totalRow.sim)}</td>
          <td className="mono">{dashNumber(totalRow.landDay)}</td><td className="mono">{dashNumber(totalRow.landNight)}</td><td className="mono">{dashNumber(totalRow.distance)}</td>
          {totalRow.custom.map((value, index) => <td className="mono" key={statsFields[index]?.uuid || index}>{dashValue(value)}</td>)}
          <td className="mono exact-stats-total-cell">{formatTime(totalRow.total)}</td>
        </tr></tfoot> : null}
      </table>
    </div>
  </>;
};

export default StatsBookTable;
