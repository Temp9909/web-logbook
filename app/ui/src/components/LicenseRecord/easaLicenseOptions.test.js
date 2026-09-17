import { describe, expect, it } from 'vitest';
import { EASA_LICENSE_CATEGORIES, namesForLicenseCategory } from './easaLicenseOptions';

describe('EASA licensing options', () => {
  it('provides the requested medical choices', () => {
    expect(namesForLicenseCategory('Medical')).toEqual(['Class 1', 'Class 2', 'LAPL Medical']);
  });

  it('provides the principal licences, ratings and certificates', () => {
    expect(EASA_LICENSE_CATEGORIES).toEqual(expect.arrayContaining([
      'Licence', 'Rating', 'Instructor Certificate', 'Examiner Certificate',
      'Medical', 'Language Proficiency', 'Training / Endorsement',
    ]));
    expect(namesForLicenseCategory('Licence')).toEqual(expect.arrayContaining(['PPL(A)', 'CPL(A)', 'ATPL(A)']));
    expect(namesForLicenseCategory('Rating')).toEqual(expect.arrayContaining(['SEP(land)', 'MEP(land)', 'IR(A)', 'Night Rating']));
  });
});
