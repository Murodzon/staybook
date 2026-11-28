import { describe, expect, it } from 'vitest';
import { dictionaries, formatDate, isLang, LANGUAGES } from '../src/lib/i18n';

describe('переводы', () => {
  it('во всех языках нет пустых строк', () => {
    for (const lang of LANGUAGES)
      for (const text of Object.values(dictionaries[lang])) expect(text.trim()).not.toBe('');
  });

  it('принимает только известные языки', () => {
    expect(isLang('ky')).toBe(true);
    expect(isLang('de')).toBe(false);
    expect(isLang(null)).toBe(false);
  });

  it('форматирует дату на трёх языках', () => {
    expect(formatDate('2026-12-05', 'ru')).toBe('5 декабря 2026 г.');
    expect(formatDate('2026-12-05', 'ky')).toBe('5-декабрь, 2026-жыл');
    expect(formatDate('2026-12-05', 'en')).toBe('5 December 2026');
  });

  it('неверная дата заменяется прочерком', () => {
    expect(formatDate(null, 'ru')).toBe('—');
    expect(formatDate('abc', 'ky')).toBe('—');
  });
});
