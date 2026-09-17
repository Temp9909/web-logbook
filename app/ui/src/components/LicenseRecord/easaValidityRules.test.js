import { describe, expect, it } from 'vitest';
import { calculateRegulatoryValidUntil, normalizeValidity, validityRuleFor } from './easaValidityRules';

describe('EASA licensing validity rules', () => {
  it('does not request validity dates for a PPL(A)', () => {
    expect(validityRuleFor('Licence', 'PPL(A)').kind).toBe('none');
    expect(normalizeValidity({ category: 'Licence', name: 'PPL(A)', valid_from: '01/01/2026', valid_until: '01/01/2027' }))
      .toEqual({ valid_from: '', valid_until: '' });
  });

  it('calculates MEP validity to the end of the corresponding month', () => {
    const rule = validityRuleFor('Rating', 'MEP(land)');
    expect(rule.months).toBe(12);
    expect(calculateRegulatoryValidUntil('17/09/2026', rule)).toBe('30/09/2027');
  });

  it('keeps a manually adjusted fixed-rating expiry date when saving', () => {
    expect(normalizeValidity({ category: 'Rating', name: 'MEP(land)', valid_from: '17/09/2026', valid_until: '15/09/2027' }))
      .toEqual({ valid_from: '17/09/2026', valid_until: '15/09/2027' });
  });

  it('calculates SEP validity for 24 months', () => {
    const rule = validityRuleFor('Rating', 'SEP(land)');
    expect(calculateRegulatoryValidUntil('12/02/2026', rule)).toBe('29/02/2028');
  });

  it('keeps medical validity manual because it is age/context dependent', () => {
    expect(validityRuleFor('Medical', 'Class 1').kind).toBe('manual');
  });
});
