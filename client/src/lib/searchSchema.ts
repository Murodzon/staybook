import { z } from 'zod';
import { addDays, nightsBetween, todayInAppTz } from './dates';

const date = z.iso.date('Укажите дату');

// Правила BR-2 и A7. Это подсказка пользователю: сервер проверит всё ещё раз.
export const makeSearchSchema = (today: string = todayInAppTz()) =>
  z
    .object({
      city: z.string().trim().min(1, 'Укажите город'),
      checkIn: date,
      checkOut: date,
      guests: z.coerce
        .number('Укажите число гостей')
        .int('Число гостей должно быть целым')
        .min(1, 'Минимум 1 гость')
        .max(20, 'Не более 20 гостей'),
    })
    .superRefine(({ checkIn, checkOut }, ctx) => {
      const fail = (path: string, message: string) =>
        ctx.addIssue({ code: 'custom', path: [path], message });

      if (checkIn < today) fail('checkIn', 'Заезд не раньше сегодняшнего дня');
      else if (checkIn > addDays(today, 365)) fail('checkIn', 'Не дальше 365 дней вперёд');

      if (checkOut <= checkIn) fail('checkOut', 'Выезд должен быть позже заезда');
      else if (nightsBetween(checkIn, checkOut) > 30) fail('checkOut', 'Не более 30 ночей');
    });

export type SearchParams = z.output<ReturnType<typeof makeSearchSchema>>;
