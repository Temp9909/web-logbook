export const EASA_LICENSE_OPTIONS = Object.freeze({
  Licence: [
    'LAPL(A)', 'PPL(A)', 'CPL(A)', 'MPL(A)', 'ATPL(A)',
  ],
  Rating: [
    'SEP(land)', 'SEP(sea)', 'MEP(land)', 'MEP(sea)',
    'SET(land)', 'SET(sea)', 'Type Rating', 'IR(A)', 'BIR(A)',
    'Night Rating', 'Aerobatic Rating',
    'Banner Towing Rating', 'Mountain Rating', 'Flight Test Rating',
  ],
  'Instructor Certificate': [
    'FI(A)', 'CRI(A)', 'IRI(A)', 'TRI(A)', 'SFI(A)',
    'MCCI(A)', 'STI(A)', 'MI',
  ],
  'Examiner Certificate': [
    'FE(A)', 'FIE(A)', 'CRE(A)', 'IRE(A)', 'TRE(A)', 'SFE(A)',
  ],
  Medical: ['Class 1', 'Class 2', 'LAPL Medical'],
  'Language Proficiency': [
    'English Level 4 (Operational)',
    'English Level 5 (Extended)',
    'English Level 6 (Expert)',
  ],
  'Training / Endorsement': [
    'PBN', 'MCC', 'APS MCC', 'Advanced UPRT', 'Radio Telephony', 'CRM',
  ],
});

export const EASA_LICENSE_CATEGORIES = Object.keys(EASA_LICENSE_OPTIONS);

export const namesForLicenseCategory = (category) => EASA_LICENSE_OPTIONS[category] || [];
