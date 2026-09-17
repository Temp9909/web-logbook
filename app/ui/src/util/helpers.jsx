import dayjs from "dayjs";

// Convert minutes to HHHH:MM format
export const convertMinutesToTime = (minutes) => {
  if (!minutes) return "00:00";

  const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mins = String(minutes % 60).padStart(2, '0');
  return `${hours}:${mins}`;
};

// Convert hours to HHHH:MM format
export const convertHoursToTime = (hours) => {
  if (!hours) return "00:00";
  const totalMinutes = Math.floor(hours * 60);
  const formattedTime = convertMinutesToTime(totalMinutes);
  return formattedTime;
};

// Convert HHHH:MM format back to minutes if needed
export const convertTimeToMinutes = (time) => {
  if (time === undefined || time === null || time === '') return 0;
  if (typeof time === 'number') return Number.isFinite(time) ? Math.round(time) : 0;
  const text = String(time);
  if (!text.includes(':')) {
    const numeric = Number(text);
    return Number.isFinite(numeric) ? Math.round(numeric) : 0;
  }
  const [hours = 0, mins = 0] = text.split(':').map(Number);
  return (Number(hours) || 0) * 60 + (Number(mins) || 0);
};

export const getValue = (obj, path) => {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
};

// custom filter function for date range
export const dateFilterFn = (row, columnId, filterValue) => {

  const rowDate = dayjs(getValue(row.original, columnId), "DD/MM/YYYY");
  const [startDate, endDate] = filterValue || [];

  // If no filter is applied, return true
  if (!startDate && !endDate) return true;

  const start = startDate ? new Date(startDate).getTime() : null;
  const end = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)).getTime() : null; // Include the end of the day

  // Check if the row date is within the selected range
  const isAfterStart = start !== null ? rowDate >= start : true;
  const isBeforeEnd = end !== null ? rowDate <= end : true;

  return isAfterStart && isBeforeEnd;
};

export const distanceNM = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const sumDistanceNM = (flights) => (Array.isArray(flights) ? flights : [])
  .reduce((total, flight) => total + distanceNM(flight?.distance), 0);

export const formatDistanceNM = (value, maximumFractionDigits = 0) =>
  distanceNM(value).toLocaleString(undefined, { maximumFractionDigits });

const TIME_FIELDS = [
  'se_time', 'me_time', 'mcc_time', 'total_time', 'night_time',
  'ifr_time', 'pic_time', 'co_pilot_time', 'dual_time',
  'instructor_time', 'cc_time'
];

// Helper function to create initial totals object
const createInitialTotals = (additionalFields = {}) => ({
  time: Object.fromEntries(TIME_FIELDS.map(field => [field, 0])),
  landings: { day: 0, night: 0 },
  sim: { time: 0 },
  distance: 0,
  ...additionalFields
});

// Helper function to update totals
const updateTotals = (totals, flight) => {
  const { time, landings, sim, distance } = flight;

  TIME_FIELDS.forEach(field => {
    totals.time[field] += convertTimeToMinutes(time[field]);
  });

  totals.landings.day += parseInt(landings.day) || 0;
  totals.landings.night += parseInt(landings.night) || 0;
  totals.sim.time += convertTimeToMinutes(sim.time);
  totals.distance += distanceNM(distance);

  return totals;
};

// Helper function to update custom field totals
const updateCustomFieldTotals = (totals, flight, customFields) => {
  if (!flight.custom_fields || !customFields || customFields.length === 0) return;

  customFields.forEach(field => {
    if (field.stats_function === 'none') return;

    const value = flight.custom_fields[field.uuid];
    if (value && value !== '') {
      let numValue = 0;
      if (field.type === 'duration') {
        numValue = convertTimeToMinutes(value);
      } else if (field.type === 'number') {
        numValue = parseFloat(value);
      } else if (field.type === 'text' || field.type === 'time') {
        numValue = 1; // For count functionality
      }

      if (totals.custom_fields && totals.custom_fields[field.uuid]) {
        totals.custom_fields[field.uuid].sum += numValue;
        totals.custom_fields[field.uuid].count += 1;
      }
    }
  });
};

// Helper function to calculate custom field final values based on stats function
export const getCustomFieldValue = (fieldData, field) => {
  if (!fieldData || !field) return 0;

  switch (field.stats_function) {
    case 'sum':
      return field.type === 'duration' ? convertMinutesToTime(fieldData.sum) : fieldData.sum;
    case 'average':
      {
        if (fieldData.count === 0) return 0;
        const average = fieldData.sum / fieldData.count;
        return field.type === 'duration' ? convertMinutesToTime(Math.round(average)) : Number(average.toFixed(2));
      }
    case 'count':
      return fieldData.count;
    default:
      return 0;
  }
};

// Helper function to format time totals
const formatTimeTotals = (totals) => ({
  time: Object.fromEntries(
    TIME_FIELDS.map(field => [field, convertMinutesToTime(totals.time[field])])
  ),
  landings: totals.landings,
  sim: { time: convertMinutesToTime(totals.sim.time) },
  distance: totals.distance
});

export const getStats = (data, airportsMap) => {
  data = Array.isArray(data) ? data.filter(Boolean) : [];
  const sets = {
    airports: new Set(),
    routes: new Set(),
    aircraftRegs: new Set(),
    aircraftModels: new Set(),
    countries: new Set(),
  };

  const totals = createInitialTotals();

  data.forEach((flight) => {
    const { departure, arrival, aircraft } = flight;

    // Update sets
    if (departure.place) sets.airports.add(departure.place);
    if (arrival.place) sets.airports.add(arrival.place);
    if (aircraft.reg_name) sets.aircraftRegs.add(aircraft.reg_name);
    if (aircraft.model) sets.aircraftModels.add(aircraft.model);
    if (departure.place && arrival.place) {
      sets.routes.add(`${departure.place}-${arrival.place}`);
    }

    if (departure.place && airportsMap) {
      const airport = airportsMap.get(departure.place);
      if (airport) {
        sets.countries.add(airport.country);
      }
    }
    if (arrival.place && airportsMap) {
      const airport = airportsMap.get(arrival.place);
      if (airport) {
        sets.countries.add(airport.country);
      }
    }
    // Update totals
    updateTotals(totals, flight);
  });

  return {
    ...Object.fromEntries(
      Object.entries(sets).map(([key, set]) => [key, set.size])
    ),
    totals: formatTimeTotals(totals),
  };
};

export const getTotalsByMonthAndYear = (flights, customFields = []) => {
  flights = Array.isArray(flights) ? flights.filter(Boolean) : [];
  customFields = Array.isArray(customFields) ? customFields.filter(Boolean) : [];
  const totals = flights.reduce((acc, flight) => {
    const [, month, year] = flight.date.split('/');
    const key = `${year}-${month}`;

    if (!acc[key]) {
      acc[key] = createInitialTotals({ year, month });
      // Initialize custom fields
      acc[key].custom_fields = {};
      customFields.forEach(field => {
        if (field.stats_function !== 'none') {
          acc[key].custom_fields[field.uuid] = { sum: 0, count: 0 };
        }
      });
    }

    updateTotals(acc[key], flight);
    updateCustomFieldTotals(acc[key], flight, customFields);
    return acc;
  }, {});

  return Object.values(totals).sort((a, b) =>
    a.year === b.year ? a.month - b.month : b.year - a.year
  );
};

export const getTotalsByAircraft = (flights, type, models, aircrafts, customFields, allCategories = []) => {
  flights = Array.isArray(flights) ? flights : [];
  models = Array.isArray(models) ? models : [];
  aircrafts = Array.isArray(aircrafts) ? aircrafts : [];
  customFields = Array.isArray(customFields) ? customFields : [];
  allCategories = Array.isArray(allCategories) ? allCategories : [];

  const modelCategories = type === "category" ?
    models.reduce((acc, row) => {
      if (!row) return acc;
      const model = row.model;
      const category = row.category;
      if (model) acc[model] = String(category || '').split(',').map(c => c.trim()).filter(Boolean);
      return acc;
    }, {}) : {};

  const knownCategories = type === "category"
    ? new Set(Object.values(modelCategories).flat())
    : new Set();

  const aircraftMap = aircrafts.reduce((acc, a) => {
    if (a?.reg) acc[a.reg] = a;
    return acc;
  }, {});

  const createGroupTotals = (key) => {
    const group = createInitialTotals({ model: key });
    group.custom_fields = {};
    customFields.forEach(field => {
      if (field.stats_function !== 'none') {
        group.custom_fields[field.uuid] = { sum: 0, count: 0 };
      }
    });
    return group;
  };

  const initialTotals = {};
  if (type === "category") {
    const categoriesToShow = Array.from(new Set([
      ...allCategories,
      ...Object.values(modelCategories).flat(),
      ...(aircrafts || []).flatMap((aircraft) =>
        String(aircraft?.category || '').split(',').map(c => c.trim()).filter(Boolean)
      ),
    ].map((category) => String(category || '').trim())
      .filter((category) => category && category !== 'Uncategorized')));

    categoriesToShow.forEach((category) => {
      initialTotals[category] = createGroupTotals(category);
    });
  }

  const totals = flights.filter(Boolean).reduce((acc, flight) => {
    const flightAircraft = flight?.aircraft || {};
    const aircraftType = flightAircraft.model;
    const aircraftReg = flightAircraft.reg_name;

    let keys;
    const ac = aircraftMap[aircraftReg];

    if (aircraftType) {
      // Normal case: real aircraft. Category statistics must contain category
      // names only; never fall back to the aircraft type when no category is set.
      if (type === "category") {
        if (ac) {
          const effectiveCategories = String(ac.category || '').split(',').map(c => c.trim()).filter(Boolean);
          keys = effectiveCategories;
        } else {
          const categoriesForType = modelCategories[aircraftType] || [];
          keys = categoriesForType;
        }
      } else {
        keys = [aircraftType];
      }
    } else {
      // Simulator case. In category mode, use mapped categories when the
      // simulator type is a known aircraft type, a category name when it is
      // explicitly one, and otherwise the generic Simulator category.
      const simType = flight.sim?.type;
      if (type === "category") {
        const categoriesForSimType = modelCategories[simType] || [];
        if (categoriesForSimType.length > 0) {
          keys = categoriesForSimType;
        } else if (simType && knownCategories.has(simType)) {
          keys = [simType];
        } else {
          keys = ["Simulator"];
        }
      } else {
        keys = [simType || "Simulator"];
      }
    }

    const safeKeys = Array.isArray(keys) ? keys.filter(Boolean) : [];
    safeKeys.forEach((key) => {
      if (!acc[key]) {
        acc[key] = createGroupTotals(key);
      }
      updateTotals(acc[key], flight);
      updateCustomFieldTotals(acc[key], flight, customFields);
    });

    return acc;
  }, initialTotals);

  return Object.values(totals)
    .filter((row) => row.model !== 'Uncategorized')
    .sort((a, b) => a.model.localeCompare(b.model));
};

export const printPerson = person => {
  if (!person) return '';
  return `${person.first_name} ${person.middle_name} ${person.last_name}`
}