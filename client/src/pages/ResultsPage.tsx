import { Link, useSearchParams } from 'react-router';
import { Icon, type IconName } from '../components/Icon';
import { CITIES } from '../lib/cities';
import { formatDate } from '../lib/i18n';
import { usePreferences } from '../lib/preferences';

export function ResultsPage() {
  const [params] = useSearchParams();
  const { t, lang } = usePreferences();
  const city = params.get('city');
  const known = CITIES.find((item) => item.value === city);
  const cityName = known ? t(known.label) : (city ?? '—');
  const chips: { icon: IconName; text: string }[] = [
    { icon: 'calendar', text: `${formatDate(params.get('checkIn'), lang)} — ${formatDate(params.get('checkOut'), lang)}` },
    { icon: 'users', text: `${t('guests')}: ${params.get('guests') ?? '—'}` },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link to="/" className="inline-flex min-h-11 items-center gap-2 font-bold text-brand-700 hover:underline dark:text-teal-300">
        <Icon name="arrowLeft" />
        {t('newSearch')}
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight break-words">
        {t('hotels')}: {cityName}
      </h1>
      <ul className="mt-4 flex flex-wrap gap-2">
        {chips.map(({ icon, text }) => (
          <li key={icon} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold dark:border-white/10 dark:bg-[#101c1b]">
            <Icon name={icon} className="size-4 text-brand-600 dark:text-teal-300" />
            {text}
          </li>
        ))}
      </ul>
      <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-white/20 dark:bg-[#101c1b]">
        <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-white/10 dark:text-teal-300">
          <Icon name="search" className="size-7" />
        </span>
        <p className="text-lg font-extrabold">{t('soonTitle')}</p>
        <p className="mt-1 text-slate-600 dark:text-slate-300">{t('soonText')}</p>
      </div>
    </div>
  );
}
