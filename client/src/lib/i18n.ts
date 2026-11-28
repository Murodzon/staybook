export const LANGUAGES = ['ru', 'ky', 'en'] as const;
export type Lang = (typeof LANGUAGES)[number];

const ru = {
  pageTitle: 'StayBook — бронирование номеров',
  langLabel: 'Язык',
  themeToDark: 'Включить тёмную тему',
  themeToLight: 'Включить светлую тему',
  footerNote: 'Учебный проект: бронирование номеров. Оплата имитируется.',
  heroTitle: 'Найдите номер для своей поездки',
  heroText: 'Выберите город и даты. Покажем отели, где есть свободный номер на все ночи.',
  city: 'Город',
  cityPlaceholder: 'Куда едете?',
  checkIn: 'Заезд',
  checkOut: 'Выезд',
  guests: 'Гостей',
  search: 'Найти',
  popularCities: 'Популярные города:',
  cityBishkek: 'Бишкек',
  cityCholponAta: 'Чолпон-Ата',
  cityOsh: 'Ош',
  errCity: 'Укажите город',
  errDate: 'Укажите дату',
  errGuests: 'Укажите число гостей',
  errGuestsInteger: 'Число гостей должно быть целым',
  errGuestsMin: 'Минимум 1 гость',
  errGuestsMax: 'Не более 20 гостей',
  errCheckInPast: 'Заезд не раньше сегодняшнего дня',
  errCheckInFar: 'Не дальше 365 дней вперёд',
  errCheckOutOrder: 'Выезд должен быть позже заезда',
  errTooLong: 'Не более 30 ночей',
  benefits: 'Преимущества',
  instantTitle: 'Мгновенное подтверждение',
  instantText: 'Номер бронирования вы получаете сразу, без ожидания ответа отеля.',
  priceTitle: 'Цена фиксируется',
  priceText: 'Итог виден до подтверждения и не меняется после бронирования.',
  safeTitle: 'Без двойных броней',
  safeText: 'Один номер нельзя продать двум гостям на одни и те же ночи.',
  newSearch: 'Новый поиск',
  hotels: 'Отели',
  soonTitle: 'Список отелей ещё в разработке',
  soonText: 'Он появится на следующем шаге.',
  notFound: 'Страница не найдена',
  goHome: 'На главную',
};

export type TextKey = keyof typeof ru;
export type Dictionary = Record<TextKey, string>;

// Тип Dictionary не даст забыть перевод: без любого ключа проверка типов не пройдёт.
const ky: Dictionary = {
  pageTitle: 'StayBook — бөлмө брондоо',
  langLabel: 'Тил',
  themeToDark: 'Караңгы теманы күйгүзүү',
  themeToLight: 'Жарык теманы күйгүзүү',
  footerNote: 'Окуу долбоору: бөлмө брондоо. Төлөм шарттуу түрдө жүргүзүлөт.',
  heroTitle: 'Сапарыңыз үчүн бөлмө табыңыз',
  heroText: 'Шаарды жана күндөрдү тандаңыз. Бардык түндөргө бош бөлмөсү бар мейманканаларды көрсөтөбүз.',
  city: 'Шаар',
  cityPlaceholder: 'Каякка барасыз?',
  checkIn: 'Келүү',
  checkOut: 'Кетүү',
  guests: 'Конок саны',
  search: 'Издөө',
  popularCities: 'Таанымал шаарлар:',
  cityBishkek: 'Бишкек',
  cityCholponAta: 'Чолпон-Ата',
  cityOsh: 'Ош',
  errCity: 'Шаарды жазыңыз',
  errDate: 'Күндү көрсөтүңүз',
  errGuests: 'Конок санын жазыңыз',
  errGuestsInteger: 'Конок саны бүтүн сан болушу керек',
  errGuestsMin: 'Кеминде 1 конок',
  errGuestsMax: '20 коноктон ашпашы керек',
  errCheckInPast: 'Келүү күнү бүгүндөн эрте болбошу керек',
  errCheckInFar: '365 күндөн алыс болбошу керек',
  errCheckOutOrder: 'Кетүү күнү келүү күнүнөн кийин болушу керек',
  errTooLong: '30 түндөн ашпашы керек',
  benefits: 'Артыкчылыктар',
  instantTitle: 'Дароо ырастоо',
  instantText: 'Брондоо номерин мейманкананын жообун күтпөй эле дароо аласыз.',
  priceTitle: 'Баа өзгөрбөйт',
  priceText: 'Жалпы сумма ырастоого чейин көрүнөт жана брондогондон кийин өзгөрбөйт.',
  safeTitle: 'Кош брондоо жок',
  safeText: 'Бир бөлмө ошол эле түндөргө эки конокко сатылбайт.',
  newSearch: 'Жаңы издөө',
  hotels: 'Мейманканалар',
  soonTitle: 'Мейманканалардын тизмеси даярдалууда',
  soonText: 'Ал кийинки кадамда пайда болот.',
  notFound: 'Барак табылган жок',
  goHome: 'Башкы бетке',
};

const en: Dictionary = {
  pageTitle: 'StayBook — hotel room booking',
  langLabel: 'Language',
  themeToDark: 'Switch to dark theme',
  themeToLight: 'Switch to light theme',
  footerNote: 'Student project: hotel room booking. Payment is simulated.',
  heroTitle: 'Find a room for your trip',
  heroText: 'Choose a city and dates. We will show hotels with a room free for every night.',
  city: 'City',
  cityPlaceholder: 'Where are you going?',
  checkIn: 'Check-in',
  checkOut: 'Check-out',
  guests: 'Guests',
  search: 'Search',
  popularCities: 'Popular cities:',
  cityBishkek: 'Bishkek',
  cityCholponAta: 'Cholpon-Ata',
  cityOsh: 'Osh',
  errCity: 'Enter a city',
  errDate: 'Enter a date',
  errGuests: 'Enter the number of guests',
  errGuestsInteger: 'The number of guests must be whole',
  errGuestsMin: 'At least 1 guest',
  errGuestsMax: 'No more than 20 guests',
  errCheckInPast: 'Check-in cannot be before today',
  errCheckInFar: 'No more than 365 days ahead',
  errCheckOutOrder: 'Check-out must be after check-in',
  errTooLong: 'No more than 30 nights',
  benefits: 'Benefits',
  instantTitle: 'Instant confirmation',
  instantText: 'You get a booking number right away, without waiting for the hotel.',
  priceTitle: 'Locked-in price',
  priceText: 'You see the total before confirming, and it stays the same after booking.',
  safeTitle: 'No double bookings',
  safeText: 'A room cannot be sold to two guests for the same nights.',
  newSearch: 'New search',
  hotels: 'Hotels',
  soonTitle: 'The hotel list is still in development',
  soonText: 'It will appear in the next step.',
  notFound: 'Page not found',
  goHome: 'Back to home',
};

export const dictionaries: Record<Lang, Dictionary> = { ru, ky, en };

export const isLang = (value: unknown): value is Lang => LANGUAGES.includes(value as Lang);

// В части браузеров нет кыргызских названий месяцев в Intl, поэтому они заданы здесь.
const KY_MONTHS = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
];

// Для пустой или неверной даты из адреса — «—».
export const formatDate = (date: string | null, lang: Lang): string => {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!date || Number.isNaN(parsed.getTime())) return '—';
  if (lang === 'ky') {
    return `${parsed.getUTCDate()}-${KY_MONTHS[parsed.getUTCMonth()]}, ${parsed.getUTCFullYear()}-жыл`;
  }
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
};
