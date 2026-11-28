import { Link, useSearchParams } from 'react-router';
import { Icon, type IconName } from '../components/Icon';
import { formatDate } from '../lib/dates';

export function ResultsPage() {
  const [params] = useSearchParams();
  const chips: { icon: IconName; text: string }[] = [
    { icon: 'calendar', text: `${formatDate(params.get('checkIn'))} — ${formatDate(params.get('checkOut'))}` },
    { icon: 'users', text: `Гостей: ${params.get('guests') ?? '—'}` },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link to="/" className="inline-flex min-h-11 items-center gap-2 font-bold text-brand-700 hover:underline">
        <Icon name="arrowLeft" />
        Новый поиск
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight break-words">
        Отели: {params.get('city') ?? '—'}
      </h1>
      <ul className="mt-4 flex flex-wrap gap-2">
        {chips.map(({ icon, text }) => (
          <li key={icon} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold">
            <Icon name={icon} className="size-4 text-brand-600" />
            {text}
          </li>
        ))}
      </ul>
      <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <Icon name="search" className="size-7" />
        </span>
        <p className="text-lg font-extrabold">Список отелей ещё в разработке</p>
        <p className="mt-1 text-slate-600">Он появится на следующем шаге.</p>
      </div>
    </div>
  );
}
