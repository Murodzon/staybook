import { useNavigate } from 'react-router';
import { Icon, type IconName } from '../components/Icon';
import { Mountains } from '../components/Mountains';
import { SearchForm } from '../components/SearchForm';

const BENEFITS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'bolt', title: 'Мгновенное подтверждение', text: 'Номер бронирования вы получаете сразу, без ожидания ответа отеля.' },
  { icon: 'tag', title: 'Цена фиксируется', text: 'Итог виден до подтверждения и не меняется после бронирования.' },
  { icon: 'shield', title: 'Без двойных броней', text: 'Один номер нельзя продать двум гостям на одни и те же ночи.' },
];

export function SearchPage() {
  const navigate = useNavigate();
  return (
    <>
      <section className="relative overflow-hidden bg-linear-to-b from-brand-900 via-brand-700 to-brand-600 text-white">
        <Mountains />
        <div aria-hidden="true" className="absolute top-16 right-[14%] hidden size-24 rounded-full bg-sun shadow-[0_0_80px_20px_rgb(246_180_75/0.35)] md:block" />
        <div className="relative mx-auto max-w-6xl px-4 pt-12 pb-32 sm:px-6 sm:pt-20 sm:pb-56">
          <h1 className="max-w-2xl text-4xl leading-tight font-extrabold tracking-tight text-balance sm:text-5xl">
            Найдите номер для своей поездки
          </h1>
          <p className="mt-4 mb-8 max-w-xl text-lg text-white/85">
            Выберите город и даты. Покажем отели, где есть свободный номер на все ночи.
          </p>
          <SearchForm
            onSearch={({ guests, ...rest }) =>
              navigate(`/hotels?${new URLSearchParams({ ...rest, guests: String(guests) })}`)
            }
          />
        </div>
      </section>

      <section aria-label="Преимущества" className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:px-6 md:grid-cols-3">
        {BENEFITS.map(({ icon, title, text }) => (
          <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6">
            <span className="mb-4 grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Icon name={icon} className="size-6" />
            </span>
            <h2 className="mb-1 text-lg font-extrabold">{title}</h2>
            <p className="text-slate-600">{text}</p>
          </article>
        ))}
      </section>
    </>
  );
}
