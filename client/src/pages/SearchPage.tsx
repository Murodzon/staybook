import { useNavigate } from 'react-router';
import { Icon, type IconName } from '../components/Icon';
import { Landscape } from '../components/Landscape';
import { SearchForm } from '../components/SearchForm';
import { TundukSun } from '../components/TundukSun';
import type { TextKey } from '../lib/i18n';
import { usePreferences } from '../lib/preferences';

const BENEFITS: { icon: IconName; title: TextKey; text: TextKey }[] = [
  { icon: 'bolt', title: 'instantTitle', text: 'instantText' },
  { icon: 'tag', title: 'priceTitle', text: 'priceText' },
  { icon: 'shield', title: 'safeTitle', text: 'safeText' },
];

export function SearchPage() {
  const navigate = useNavigate();
  const { t } = usePreferences();
  return (
    <>
      <section className="land-hero relative overflow-hidden bg-linear-to-b from-brand-900 via-brand-700 to-brand-600 text-white dark:via-[#072524] dark:to-[#0a3a36]">
        <Landscape className="absolute inset-x-0 bottom-0 h-64 sm:h-80" />
        <TundukSun className="absolute top-8 right-[10%] hidden size-52 drop-shadow-[0_0_40px_rgb(246_180_75/0.35)] md:block" />
        <div className="relative mx-auto max-w-6xl px-4 pt-12 pb-32 sm:px-6 sm:pt-20 sm:pb-56">
          <h1 className="max-w-2xl text-4xl leading-tight font-extrabold tracking-tight text-balance sm:text-5xl">
            {t('heroTitle')}
          </h1>
          <p className="mt-4 mb-8 max-w-xl text-lg text-white/85">
            {t('heroText')}
          </p>
          <SearchForm
            onSearch={({ guests, ...rest }) =>
              navigate(`/hotels?${new URLSearchParams({ ...rest, guests: String(guests) })}`)
            }
          />
        </div>
      </section>

      <section aria-label={t('benefits')} className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:px-6 md:grid-cols-3">
        {BENEFITS.map(({ icon, title, text }) => (
          <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#101c1b]">
            <span className="mb-4 grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-white/10 dark:text-teal-300">
              <Icon name={icon} className="size-6" />
            </span>
            <h2 className="mb-1 text-lg font-extrabold">{t(title)}</h2>
            <p className="text-slate-600 dark:text-slate-300">{t(text)}</p>
          </article>
        ))}
      </section>
    </>
  );
}
