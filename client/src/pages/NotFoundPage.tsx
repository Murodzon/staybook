import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Страница не найдена</h1>
      <Link to="/" className="inline-flex min-h-11 items-center font-semibold text-teal-800 underline">
        На главную
      </Link>
    </>
  );
}
