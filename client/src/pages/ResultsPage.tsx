import { Link, useSearchParams } from 'react-router';

export function ResultsPage() {
  const [params] = useSearchParams();
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Результаты поиска</h1>
      <dl className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-white p-5 shadow-sm">
        <dt className="text-slate-600">Город</dt>
        <dd className="break-words">{params.get('city')}</dd>
        <dt className="text-slate-600">Заезд</dt>
        <dd>{params.get('checkIn')}</dd>
        <dt className="text-slate-600">Выезд</dt>
        <dd>{params.get('checkOut')}</dd>
        <dt className="text-slate-600">Гостей</dt>
        <dd>{params.get('guests')}</dd>
      </dl>
      <p className="mb-4 text-slate-600">Список отелей появится на следующем шаге.</p>
      <Link to="/" className="inline-flex min-h-11 items-center font-semibold text-teal-800 underline">
        Новый поиск
      </Link>
    </>
  );
}
