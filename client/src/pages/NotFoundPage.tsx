import { Link } from 'react-router';
import { usePreferences } from '../lib/preferences';

export function NotFoundPage() {
  const { t } = usePreferences();
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
      <p className="text-6xl font-extrabold text-brand-600 dark:text-teal-300">404</p>
      <h1 className="mt-3 mb-6 text-2xl font-extrabold">{t('notFound')}</h1>
      <Link to="/" className="inline-flex min-h-11 items-center rounded-xl bg-sun px-6 font-extrabold text-ink hover:bg-sun-hover">
        {t('goHome')}
      </Link>
    </div>
  );
}
