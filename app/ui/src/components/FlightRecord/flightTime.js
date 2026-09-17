const parseClockMinutes = (value) => {
  const raw = String(value ?? '').trim();
  const match = raw.match(/^(\d{1,2})(?::?)(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return (hours * 60) + minutes;
};

export const calculateFlightDuration = (departure, arrival) => {
  const departureMinutes = parseClockMinutes(departure);
  const arrivalMinutes = parseClockMinutes(arrival);
  if (departureMinutes === null || arrivalMinutes === null) return '';
  const totalMinutes = (arrivalMinutes - departureMinutes + 1440) % 1440;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, '0')}`;
};

export const durationToMinutes = (value) => {
  const match = String(value ?? '').trim().match(/^(\d{1,3}):(\d{2})$/);
  if (!match) return 0;
  return (Number(match[1]) * 60) + Number(match[2]);
};

const ROLE_FIELD = {
  PIC: 'pic_time',
  Dual: 'dual_time',
  'Co-pilot': 'co_pilot_time',
};

export const applyAutomaticFlightTimes = ({ time = {}, totalTime = '', role = '', autoFill = {} }) => {
  const previousTotal = time.total_time || '';
  const nextTime = { ...time, total_time: totalTime };
  const automaticFields = new Set(
    Object.entries(autoFill)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([key]) => key),
  );
  const roleField = ROLE_FIELD[role];
  if (roleField) automaticFields.add(roleField);

  automaticFields.forEach((key) => {
    const existing = nextTime[key] || '';
    if (totalTime && (!existing || existing === previousTotal)) nextTime[key] = totalTime;
    if (!totalTime && existing === previousTotal) nextTime[key] = '';
  });

  return nextTime;
};
