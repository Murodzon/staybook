// Даты — строки YYYY-MM-DD. «Сегодня» считается в часовом поясе проекта (допущение A5).
export const APP_TIMEZONE = 'Asia/Bishkek';

export const todayInAppTz = (now: Date = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

const toUtc = (date: string) => Date.parse(`${date}T00:00:00Z`);

export const addDays = (date: string, days: number): string =>
  new Date(toUtc(date) + days * 86_400_000).toISOString().slice(0, 10);

export const nightsBetween = (checkIn: string, checkOut: string): number =>
  Math.round((toUtc(checkOut) - toUtc(checkIn)) / 86_400_000);
