import { LANGUAGES, type Lang } from '../lib/i18n';
import { usePreferences } from '../lib/preferences';
import { Icon } from './Icon';

const NAMES: Record<Lang, { short: string; full: string }> = {
  ru: { short: 'RU', full: 'Русский' },
  ky: { short: 'KG', full: 'Кыргызча' },
  en: { short: 'EN', full: 'English' },
};

export function HeaderControls() {
  const { lang, setLang, t, dark, toggleTheme } = usePreferences();
  const themeLabel = t(dark ? 'themeToLight' : 'themeToDark');

  return (
    <div className="flex items-center gap-2">
      <div role="group" aria-label={t('langLabel')} className="flex rounded-xl bg-white/10 p-1">
        {LANGUAGES.map((code) => (
          <button
            key={code}
            type="button"
            lang={code}
            title={NAMES[code].full}
            aria-pressed={code === lang}
            onClick={() => setLang(code)}
            className="h-9 min-w-10 cursor-pointer rounded-lg px-2 text-sm font-extrabold text-white/80 transition hover:text-white aria-pressed:bg-white aria-pressed:text-brand-900"
          >
            {NAMES[code].short}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={themeLabel}
        title={themeLabel}
        className="grid size-11 cursor-pointer place-items-center rounded-xl bg-white/10 transition hover:bg-white/20"
      >
        <Icon name={dark ? 'sun' : 'moon'} />
      </button>
    </div>
  );
}
