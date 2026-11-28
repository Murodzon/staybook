import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { addDays, todayInAppTz } from '../lib/dates';
import { makeSearchSchema, type SearchParams } from '../lib/searchSchema';
import { FormField } from './FormField';
import { Icon } from './Icon';

const CITIES = ['Бишкек', 'Чолпон-Ата', 'Ош'];

type Props = { onSearch: (params: SearchParams) => void };

export function SearchForm({ onSearch }: Props) {
  const today = todayInAppTz();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitted },
  } = useForm({
    resolver: zodResolver(makeSearchSchema(today)),
    defaultValues: {
      city: '',
      checkIn: addDays(today, 7),
      checkOut: addDays(today, 11),
      guests: 2,
    },
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSearch)}
      className="rounded-3xl bg-white p-3 text-ink shadow-2xl shadow-brand-900/25 sm:p-4"
    >
      <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_0.7fr_auto]">
        <FormField label="Город" icon="pin" placeholder="Куда едете?" error={errors.city?.message} {...register('city')} />
        <FormField label="Заезд" icon="calendar" type="date" min={today} error={errors.checkIn?.message} {...register('checkIn')} />
        <FormField label="Выезд" icon="calendar" type="date" min={addDays(today, 1)} error={errors.checkOut?.message} {...register('checkOut')} />
        <FormField label="Гостей" icon="users" type="number" min={1} max={20} error={errors.guests?.message} {...register('guests')} />
        <button
          type="submit"
          className="flex h-[66px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-sun px-7 font-extrabold text-ink transition hover:bg-sun-hover sm:col-span-2 lg:col-span-1"
        >
          <Icon name="search" />
          Найти
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 px-1">
        <span className="text-sm font-medium text-slate-500">Популярные города:</span>
        {CITIES.map((city) => (
          <button
            key={city}
            type="button"
            onClick={() => setValue('city', city, { shouldValidate: isSubmitted })}
            className="min-h-11 cursor-pointer rounded-full bg-brand-50 px-4 text-sm font-bold text-brand-700 transition hover:bg-brand-100"
          >
            {city}
          </button>
        ))}
      </div>
    </form>
  );
}
