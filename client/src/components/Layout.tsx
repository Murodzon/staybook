import { Link, Outlet } from 'react-router';
import { usePreferences } from '../lib/preferences';
import { HeaderControls } from './HeaderControls';

export function Layout() {
  const { t } = usePreferences();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-brand-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 sm:px-6">
          <Link to="/" className="inline-flex min-h-11 items-center gap-2.5 text-xl font-extrabold tracking-tight">
            <span aria-hidden="true" className="grid size-9 place-items-center rounded-xl bg-sun text-lg text-ink">
              S
            </span>
            StayBook
          </Link>
          <HeaderControls />
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white dark:border-white/10 dark:bg-[#101c1b]">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-6 text-sm text-slate-500 sm:px-6 dark:text-slate-400">
          <span className="font-bold text-ink dark:text-white">StayBook</span>
          <span>{t('footerNote')}</span>
        </div>
      </footer>
    </div>
  );
}
