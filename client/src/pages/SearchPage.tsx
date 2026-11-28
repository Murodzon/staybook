import { useNavigate } from 'react-router';
import { SearchForm } from '../components/SearchForm';

export function SearchPage() {
  const navigate = useNavigate();
  return (
    <>
      <h1 className="mb-2 text-3xl font-bold">Найдите свободный номер</h1>
      <p className="mb-6 text-slate-600">Укажите город, даты и число гостей.</p>
      <SearchForm
        onSearch={({ guests, ...rest }) =>
          navigate(`/hotels?${new URLSearchParams({ ...rest, guests: String(guests) })}`)
        }
      />
    </>
  );
}
