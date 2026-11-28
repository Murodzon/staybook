import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { addDays, todayInAppTz } from '../lib/dates';
import { makeSearchSchema, type SearchParams } from '../lib/searchSchema';
import { FormField } from './FormField';

type Props = { onSearch: (params: SearchParams) => void };

export function SearchForm({ onSearch }: Props) {
  const today = todayInAppTz();
  const {
    register,
    handleSubmit,
    formState: { errors },
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
      className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <FormField label="Город" placeholder="Бишкек" error={errors.city?.message} {...register('city')} />
      </div>
      <FormField label="Заезд" type="date" min={today} error={errors.checkIn?.message} {...register('checkIn')} />
      <FormField label="Выезд" type="date" min={addDays(today, 1)} error={errors.checkOut?.message} {...register('checkOut')} />
      <FormField label="Гостей" type="number" min={1} max={20} error={errors.guests?.message} {...register('guests')} />
      <button
        type="submit"
        className="min-h-11 self-end rounded-lg bg-teal-700 px-4 font-semibold text-white hover:bg-teal-800"
      >
        Найти отели
      </button>
    </form>
  );
}
