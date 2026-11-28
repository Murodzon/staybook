import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { CITIES } from '../lib/cities';
import { addDays, todayInAppTz } from '../lib/dates';
import type { TextKey } from '../lib/i18n';
import { usePreferences } from '../lib/preferences';
import { makeSearchSchema, type SearchParams } from '../lib/searchSchema';
import { FormField } from './FormField';
import { Icon } from './Icon';

type Props = { onSearch: (params: SearchParams) => void };

export function SearchForm({ onSearch }: Props) {
  const today = todayInAppTz();
  const { t } = usePreferences();
  const error = (message?: string) => (message ? t(message as TextKey) : undefined);
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
      className="rounded-3xl bg-white p-3 text-ink shadow-2xl shadow-brand-900/25 sm:p-4 dark:bg-[#101c1b] dark:text-slate-100 dark:ring-1 dark:ring-white/10"
    >
      <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_0.7fr_auto]">
        <FormField label={t('city')} icon="pin" placeholder={t('cityPlaceholder')} error={error(errors.city?.message)} {...register('city')} />
        <FormField label={t('checkIn')} icon="calendar" type="date" min={today} error={error(errors.checkIn?.message)} {...register('checkIn')} />
        <FormField label={t('checkOut')} icon="calendar" type="date" min={addDays(today, 1)} error={error(errors.checkOut?.message)} {...register('checkOut')} />
        <FormField label={t('guests')} icon="users" type="number" min={1} max={20} error={error(errors.guests?.message)} {...register('guests')} />
        <button
          type="submit"
          className="flex h-[66px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-sun px-7 font-extrabold text-ink transition hover:bg-sun-hover sm:col-span-2 lg:col-span-1"
        >
          <Icon name="search" />
          {t('search')}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 px-1">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('popularCities')}</span>
        {CITIES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setValue('city', value, { shouldValidate: isSubmitted })}
            className="min-h-11 cursor-pointer rounded-full bg-brand-50 px-4 text-sm font-bold text-brand-700 transition hover:bg-brand-100 dark:bg-white/10 dark:text-teal-200 dark:hover:bg-white/20"
          >
            {t(label)}
          </button>
        ))}
      </div>
    </form>
  );
}
