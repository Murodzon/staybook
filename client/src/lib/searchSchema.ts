import { z } from 'zod';
import { addDays, nightsBetween, todayInAppTz } from './dates';
import type { TextKey } from './i18n';

// Сообщения об ошибках — это ключи словаря: перевод делает интерфейс.
const key = (name: TextKey) => name;

const date = z.iso.date(key('errDate'));

// Правила BR-2 и A7. Это подсказка пользователю: сервер проверит всё ещё раз.
export const makeSearchSchema = (today: string = todayInAppTz()) =>
  z
    .object({
      city: z.string().trim().min(1, key('errCity')),
      checkIn: date,
      checkOut: date,
      guests: z.coerce
        .number(key('errGuests'))
        .int(key('errGuestsInteger'))
        .min(1, key('errGuestsMin'))
        .max(20, key('errGuestsMax')),
    })
    .superRefine(({ checkIn, checkOut }, ctx) => {
      const fail = (path: string, message: string) =>
        ctx.addIssue({ code: 'custom', path: [path], message });

      if (checkIn < today) fail('checkIn', key('errCheckInPast'));
      else if (checkIn > addDays(today, 365)) fail('checkIn', key('errCheckInFar'));

      if (checkOut <= checkIn) fail('checkOut', key('errCheckOutOrder'));
      else if (nightsBetween(checkIn, checkOut) > 30) fail('checkOut', key('errTooLong'));
    });

export type SearchParams = z.output<ReturnType<typeof makeSearchSchema>>;
