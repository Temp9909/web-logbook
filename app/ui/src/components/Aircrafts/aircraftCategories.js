const REMOVED_CATEGORY_NAMES = new Set([
  'helicopter',
  'helicoptère',
  'helicoptere',
  'hélico',
  'helico',
  'glider',
  'planeur',
  'balloon',
  'ballon',
  'montgolfière',
  'montgolfiere',
]);

export const isAircraftCategoryAllowed = (value) => !REMOVED_CATEGORY_NAMES.has(
  String(value || '').trim().toLocaleLowerCase(),
);

export const DEFAULT_CATEGORIES = [
  'Single Engine',
  'Multi Engine',
  'Multi Pilot',
  'IFR',
  'Complex',
  'Tailwheel',
  'Turboprop',
  'Jet',
];

export const splitCategories = (value) => String(value || '')
  .split(',')
  .map((item) => item.trim())
  .filter((item) => Boolean(item) && isAircraftCategoryAllowed(item));
