const NO_FIXED_EXPIRY = Object.freeze({
  kind: 'none',
  label: 'No fixed expiry',
});

const fixed = (months, label, endOfMonth = true) => Object.freeze({
  kind: 'fixed',
  months,
  endOfMonth,
  label,
});

const linked = (label) => Object.freeze({
  kind: 'none',
  label,
});

const manual = (label = 'Enter validity dates manually') => Object.freeze({
  kind: 'manual',
  label,
});

const RULES_BY_NAME = Object.freeze({
  // Part-FCL aeroplane licences do not carry a separate expiry date. Their
  // privileges still depend on valid medical/rating/recency requirements.
  'LAPL(A)': NO_FIXED_EXPIRY,
  'PPL(A)': NO_FIXED_EXPIRY,
  'CPL(A)': NO_FIXED_EXPIRY,
  'MPL(A)': NO_FIXED_EXPIRY,
  'ATPL(A)': NO_FIXED_EXPIRY,

  // Class/type and instrument ratings.
  'SEP(land)': fixed(24, '24 months · expiry at end of month'),
  'SEP(sea)': fixed(24, '24 months · expiry at end of month'),
  'SET(land)': fixed(24, '24 months · expiry at end of month'),
  'SET(sea)': fixed(24, '24 months · expiry at end of month'),
  'MEP(land)': fixed(12, '12 months · expiry at end of month'),
  'MEP(sea)': fixed(12, '12 months · expiry at end of month'),
  'Type Rating': fixed(12, '12 months by default · expiry at end of month'),
  'IR(A)': fixed(12, '12 months · expiry at end of month'),
  'BIR(A)': fixed(12, '12 months · expiry at end of month'),
  'Mountain Rating': fixed(24, '24 months · expiry at end of month'),

  // Ratings/endorsements for which Part-FCL does not set a periodic expiry.
  'Night Rating': NO_FIXED_EXPIRY,
  'Aerobatic Rating': NO_FIXED_EXPIRY,
  'Banner Towing Rating': NO_FIXED_EXPIRY,
  'Flight Test Rating': NO_FIXED_EXPIRY,

  // Instructor certificates: FCL.940 = 3 years, except MI.
  'FI(A)': fixed(36, '3 years · expiry at end of month'),
  'CRI(A)': fixed(36, '3 years · expiry at end of month'),
  'IRI(A)': fixed(36, '3 years · expiry at end of month'),
  'TRI(A)': fixed(36, '3 years · expiry at end of month'),
  'SFI(A)': fixed(36, '3 years · expiry at end of month'),
  'MCCI(A)': fixed(36, '3 years · expiry at end of month'),
  'STI(A)': fixed(36, '3 years · expiry at end of month'),
  MI: manual('Validity follows the associated FI / CRI / TRI certificate'),

  // Examiner certificates: FCL.1025 = 3 years.
  'FE(A)': fixed(36, '3 years · expiry at end of month'),
  'FIE(A)': fixed(36, '3 years · expiry at end of month'),
  'CRE(A)': fixed(36, '3 years · expiry at end of month'),
  'IRE(A)': fixed(36, '3 years · expiry at end of month'),
  'TRE(A)': fixed(36, '3 years · expiry at end of month'),
  'SFE(A)': fixed(36, '3 years · expiry at end of month'),

  // FCL.055 language proficiency re-evaluation periods. Level 6 has no
  // periodic re-evaluation requirement.
  'English Level 4 (Operational)': fixed(48, '4 years', false),
  'English Level 5 (Extended)': fixed(72, '6 years', false),
  'English Level 6 (Expert)': NO_FIXED_EXPIRY,

  // Completion/endorsement items without an independent periodic validity.
  PBN: linked('No separate expiry · privileges follow the applicable IR/BIR'),
  MCC: NO_FIXED_EXPIRY,
  'APS MCC': NO_FIXED_EXPIRY,
  'Advanced UPRT': NO_FIXED_EXPIRY,

  // Context-dependent items intentionally remain manual.
  'Class 1': manual('Validity depends on age and operational circumstances'),
  'Class 2': manual('Validity depends on age'),
  'LAPL Medical': manual('Validity depends on age'),
  'Radio Telephony': manual(),
  CRM: manual('Recurrent validity may depend on the operator and operation'),
});

const pad2 = (value) => String(value).padStart(2, '0');

const parseDate = (value) => {
  const match = String(value || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null;
  return { day, month, year };
};

const lastDayOfMonth = (year, monthOneBased) => new Date(Date.UTC(year, monthOneBased, 0)).getUTCDate();

export const calculateRegulatoryValidUntil = (validFrom, rule) => {
  if (!validFrom || rule?.kind !== 'fixed' || !Number.isFinite(rule.months)) return '';
  const parsed = parseDate(validFrom);
  if (!parsed) return '';

  const absoluteMonth = (parsed.year * 12) + (parsed.month - 1) + rule.months;
  const targetYear = Math.floor(absoluteMonth / 12);
  const targetMonthIndex = absoluteMonth % 12;
  const targetMonth = targetMonthIndex + 1;
  const day = rule.endOfMonth
    ? lastDayOfMonth(targetYear, targetMonth)
    : Math.min(parsed.day, lastDayOfMonth(targetYear, targetMonth));

  return `${pad2(day)}/${pad2(targetMonth)}/${targetYear}`;
};

export const validityRuleFor = (_category, name) => RULES_BY_NAME[name] || manual();

export const normalizeValidity = (record) => {
  const source = record || {};
  const rule = validityRuleFor(source.category, source.name);
  if (rule.kind === 'none') return { valid_from: '', valid_until: '' };
  if (rule.kind === 'fixed') {
    return {
      valid_from: source.valid_from || '',
      valid_until: source.valid_until || calculateRegulatoryValidUntil(source.valid_from, rule),
    };
  }
  return {
    valid_from: source.valid_from || '',
    valid_until: source.valid_until || '',
  };
};

export const effectiveValidUntil = (record) => {
  const rule = validityRuleFor(record?.category, record?.name);
  return rule.kind === 'none' ? '' : (record?.valid_until || '');
};
