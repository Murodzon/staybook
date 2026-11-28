import { Link, Outlet } from 'react-router';

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-brand-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center px-4 py-3 sm:px-6">
          <Link to="/" className="inline-flex min-h-11 items-center gap-2.5 text-xl font-extrabold tracking-tight">
            <span aria-hidden="true" className="grid size-9 place-items-center rounded-xl bg-sun text-lg text-ink">
              S
            </span>
            StayBook
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-6 text-sm text-slate-500 sm:px-6">
          <span className="font-bold text-ink">StayBook</span>
          <span>Учебный проект: бронирование номеров. Оплата имитируется.</span>
        </div>
      </footer>
    </div>
  );
}
