import { describe, expect, it } from 'vitest';
import { applyAutomaticFlightTimes, calculateFlightDuration, durationToMinutes, formatQuickFillLabel } from './flightTime';

describe('flight time helpers', () => {
  it('calculates a same-day duration', () => {
    expect(calculateFlightDuration('1012', '1108')).toBe('0:56');
  });

  it('calculates a flight crossing midnight', () => {
    expect(calculateFlightDuration('2345', '0015')).toBe('0:30');
  });

  it('accepts native time input values', () => {
    expect(calculateFlightDuration('09:10', '11:25')).toBe('2:15');
  });

  it('returns an empty duration until both times are valid', () => {
    expect(calculateFlightDuration('0910', '')).toBe('');
  });

  it('converts a duration to quick-fill minutes', () => {
    expect(durationToMinutes('1:26')).toBe(86);
  });

  it('formats quick-fill labels as minutes below one hour and HHMM at one hour or more', () => {
    expect(formatQuickFillLabel(40)).toBe('+40');
    expect(formatQuickFillLabel(60)).toBe('+0100');
    expect(formatQuickFillLabel(72)).toBe('+0112');
    expect(formatQuickFillLabel(125)).toBe('+0205');
  });

  it('fills the selected role and aircraft category rules', () => {
    expect(applyAutomaticFlightTimes({
      time: {},
      totalTime: '0:56',
      role: 'PIC',
      autoFill: { se_time: true, ifr_time: true, me_time: false },
    })).toMatchObject({ total_time: '0:56', pic_time: '0:56', se_time: '0:56', ifr_time: '0:56' });
  });

  it('updates automatic values but preserves manually entered time', () => {
    expect(applyAutomaticFlightTimes({
      time: { total_time: '0:50', pic_time: '0:50', se_time: '0:50', night_time: '0:20' },
      totalTime: '0:56',
      role: 'PIC',
      autoFill: { se_time: true, night_time: true },
    })).toMatchObject({ total_time: '0:56', pic_time: '0:56', se_time: '0:56', night_time: '0:20' });
  });
});
