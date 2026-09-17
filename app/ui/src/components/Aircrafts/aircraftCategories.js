export const DEFAULT_CATEGORIES = [
  'Single Engine',
  'Multi Engine',
  'Multi Pilot',
  'IFR',
  'Complex',
  'Tailwheel',
  'Turboprop',
  'Jet',
  'Helicopter',
  'Glider',
];

export const splitCategories = (value) => String(value || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);
