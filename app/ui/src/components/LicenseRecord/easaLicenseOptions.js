export const EASA_LICENSE_OPTIONS = Object.freeze({
  Licence: [
    'LAPL(A)', 'LAPL(H)', 'PPL(A)', 'PPL(H)', 'CPL(A)', 'CPL(H)',
    'MPL(A)', 'ATPL(A)', 'ATPL(H)', 'SPL', 'BPL',
  ],
  Rating: [
    'SEP(land)', 'SEP(sea)', 'TMG', 'MEP(land)', 'MEP(sea)',
    'SET(land)', 'SET(sea)', 'Type Rating', 'IR(A)', 'IR(H)', 'BIR(A)',
    'Night Rating', 'Aerobatic Rating', 'Sailplane Towing Rating',
    'Banner Towing Rating', 'Mountain Rating', 'Flight Test Rating',
  ],
  'Instructor Certificate': [
    'FI(A)', 'FI(H)', 'FI(S)', 'FI(B)', 'CRI(A)', 'IRI(A)', 'IRI(H)',
    'TRI(A)', 'TRI(H)', 'SFI(A)', 'SFI(H)', 'MCCI(A)', 'MCCI(H)',
    'STI(A)', 'STI(H)', 'MI',
  ],
  'Examiner Certificate': [
    'FE(A)', 'FE(H)', 'FE(S)', 'FE(B)', 'FIE(A)', 'FIE(H)', 'CRE(A)',
    'IRE(A)', 'IRE(H)', 'TRE(A)', 'TRE(H)', 'SFE(A)', 'SFE(H)',
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
