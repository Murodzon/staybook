import { describe, expect, it } from 'vitest';
import { nightsBetween, todayInAppTz } from '../src/lib/dates';
import { makeSearchSchema } from '../src/lib/searchSchema';

const schema = makeSearchSchema('2026-11-28');
const base = { city: 'Бишкек', checkIn: '2026-12-01', checkOut: '2026-12-05', guests: '2' };

const errorFields = (patch: object) => {
  const result = schema.safeParse({ ...base, ...patch });
  return result.success ? [] : result.error.issues.map((i) => i.path[0]);
};

describe('даты', () => {
  it('считает ночи', () => expect(nightsBetween('2026-12-01', '2026-12-05')).toBe(4));
  it('«сегодня» берётся по Бишкеку, а не по UTC', () =>
    expect(todayInAppTz(new Date('2026-11-27T19:00:00Z'))).toBe('2026-11-28'));
});

describe('форма поиска', () => {
  it('принимает верные данные', () => expect(errorFields({})).toEqual([]));
  it('заезд сегодня разрешён', () => expect(errorFields({ checkIn: '2026-11-28' })).toEqual([]));
  it('заезд вчера запрещён', () => expect(errorFields({ checkIn: '2026-11-27' })).toContain('checkIn'));
  it('выезд в день заезда запрещён', () =>
    expect(errorFields({ checkOut: '2026-12-01' })).toEqual(['checkOut']));
  it('30 ночей можно, 31 нельзя', () => {
    expect(errorFields({ checkOut: '2026-12-31' })).toEqual([]);
    expect(errorFields({ checkOut: '2027-01-01' })).toEqual(['checkOut']);
  });
  it('пустой город и 0 гостей отклоняются', () =>
    expect(errorFields({ city: '  ', guests: '0' })).toEqual(['city', 'guests']));
});
