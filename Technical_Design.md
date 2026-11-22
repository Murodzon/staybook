# StayBook — технический дизайн

| | |
| --- | --- |
| **Проект** | StayBook — платформа бронирования номеров в отелях |
| **Документ** | Технический дизайн, версия 1.0 |
| **Дата** | 21.11.2026 |
| **Основа** | «StayBook — Спецификация требований к продукту», версия 1.0 (далее — ТЗ) |
| **Стек** | TypeScript · React · Node.js + Express · PostgreSQL |
| **Подход** | Монолит: один сервер отдаёт и API, и собранный сайт; одна база данных |

---

## Содержание

1. [Введение](#1-введение)
2. [Обзор системы](#2-обзор-системы)
3. [Требования](#3-требования)
4. [Роли и права доступа](#4-роли-и-права-доступа)
5. [Архитектура системы](#5-архитектура-системы)
6. [Технологический стек](#6-технологический-стек)
7. [Архитектура Backend](#7-архитектура-backend)
8. [Проектирование базы данных](#8-проектирование-базы-данных)
9. [Проектирование API](#9-проектирование-api)
10. [Бизнес-логика](#10-бизнес-логика)
11. [Алгоритм доступности номеров](#11-алгоритм-доступности-номеров)
12. [Аутентификация и безопасность](#12-аутентификация-и-безопасность)
13. [Обработка ошибок](#13-обработка-ошибок)
14. [Конкурентное бронирование](#14-конкурентное-бронирование)
15. [Логирование](#15-логирование)
16. [Интеграции](#16-интеграции)
17. [Frontend](#17-frontend)
18. [Развёртывание](#18-развёртывание)
19. [Тестирование](#19-тестирование)
20. [Нефункциональные требования](#20-нефункциональные-требования)
21. [Ограничения и риски](#21-ограничения-и-риски)
22. [Приложения](#22-приложения)

---

## 1. Введение

### 1.1 Зачем этот документ

Здесь описано, как StayBook устроен внутри. По документу можно:

- понять, из каких частей состоит система и как они общаются;
- создать базу данных и понять, зачем нужна каждая таблица;
- реализовать API и знать, что отвечает каждый адрес;
- написать алгоритмы поиска, бронирования, отмены и отзывов;
- объяснить на защите, **почему один номер не продаётся двум гостям** на одни и те же ночи;
- подготовить тесты и демонстрацию.

### 1.2 Цели проекта

| № | Цель | Как проверить |
| --- | --- | --- |
| 1 | Гость находит отель со свободным номером на нужные даты | Поиск возвращает только подходящие отели (FR-2.2) |
| 2 | Бронирование подтверждается сразу, цена фиксируется | Бронь получает номер `SB-…`, итог не меняется (FR-4.3, FR-4.5) |
| 3 | Двойное бронирование невозможно | 20 параллельных запросов дают одну бронь (FR-4.4) |
| 4 | Менеджер управляет номерами и ценами | Кабинет `/manage` (FR-7.x) |
| 5 | Понятный интерфейс | Ошибки объясняют, что делать (UX-3, UX-4) |

### 1.3 Для кого документ

| Читатель | Что искать |
| --- | --- |
| Разработчик | Разделы 7–14: слои, база, API, алгоритмы |
| Тестировщик | Разделы 3, 11, 19: требования, сценарии, тест-кейсы |
| Преподаватель, рецензент | Разделы 2, 5, 14, 21: идея, архитектура, конкурентность, риски |
| Автор проекта | Раздел 18 и приложение 22.5: запуск и план работ |

### 1.4 Границы версии 1.0

| Входит | Не входит (как в ТЗ) |
| --- | --- |
| Регистрация, вход, профиль | Авиабилеты и туристические пакеты |
| Поиск отелей и просмотр номеров | Бонусные баллы |
| Одно бронирование — один номер в одном отеле | Возвраты средств, налоги |
| Мгновенное подтверждение, оплата имитируется | Сезонные цены |
| Мои бронирования, отмена до заезда | Интеграции с внешними системами отелей |
| Отзывы о завершённых проживаниях | Бронирование нескольких номеров сразу |
| Кабинет менеджера: отель, номера, закрытие номеров, брони | |

### 1.5 Принятые решения и допущения

Часть вопросов ТЗ оставляет открытыми. Ниже зафиксировано, как они решены в этом проекте.

**Архитектурные решения**

| № | Решение | Почему | Что отвергли |
| --- | --- | --- | --- |
| D1 | Монолит Node.js + Express | Одна база, одна транзакция на бронь, проще запуск и демонстрация | Микросервисы: лишняя сложность |
| D2 | PostgreSQL с `daterange` и `EXCLUDE` | Защита от двойной брони на уровне данных | MySQL, MongoDB: нет аналога `EXCLUDE` |
| D3 | Чистый SQL через драйвер `pg`, миграции — SQL-файлами | `EXCLUDE`, `daterange`, generated-колонки пишутся напрямую | ORM Prisma: не описывает `EXCLUDE` |
| D4 | Два слоя: HTTP и сервисы (SQL рядом с сервисом) | Меньше файлов, логика в одном месте | Три слоя: избыточно для 7 таблиц |
| D5 | JWT в `httpOnly`-cookie | Токен недоступен скрипту страницы | Токен в `localStorage`: уязвим к XSS |
| D6 | Фаза брони (предстоящая, текущая, прошедшая) вычисляется по датам | Нельзя забыть обновить статус | Хранить фазу и обновлять по расписанию |
| D7 | Цена фиксируется в брони | Требование ТЗ | Считать по текущему тарифу номера |
| D8 | Сначала расчёт (quote), потом подтверждение | ТЗ требует показать итог до подтверждения | Показывать цену после создания брони |

**Допущения**

| № | Вопрос | Решение |
| --- | --- | --- |
| A1 | Как пользователь становится менеджером | При регистрации можно отметить «Я представляю отель» → роль `manager` (учебное упрощение) |
| A2 | Когда бронь «прошедшая» | Со следующего дня после даты выезда (в день выезда бронь ещё «текущая») |
| A3 | До какого момента можно отменить | Пока сегодняшняя дата строго меньше даты заезда |
| A4 | Когда можно оставить отзыв | Для подтверждённой брони, начиная со следующего дня после выезда |
| A5 | Часовой пояс «сегодня» | Единый: `Asia/Bishkek` (`APP_TIMEZONE`) |
| A6 | Валюта | Сом (KGS), цены — целые числа |
| A7 | Ограничения на даты | Не более 30 ночей в брони и не более 365 дней вперёд |
| A8 | Несколько менеджеров у отеля | Допустимо (таблица `hotel_managers`) |
| A9 | Удаление | Отели и номера не удаляются, а скрываются, чтобы не ломать брони |
| A10 | Отмена менеджером | В ТЗ не описана, в версии 1.0 не реализуется |
| A11 | Показ номеров гостю | Только вмещающие группу и свободные на все ночи; недоступные — отдельным параметром |

---

## 2. Обзор системы

### 2.1 Что такое StayBook

StayBook — сайт, где гость выбирает отель в нужном городе, видит свободные на его даты номера и бронирует один из них.
Отельер через тот же сайт ведёт номера, цены и закрывает номера на ремонт. Оплата в версии 1.0 имитируется: бронь подтверждается сразу.

### 2.2 Главный пример (используется во всём документе)

| Что | Значение |
| --- | --- |
| Отель | «Ала-Тоо», Бишкек |
| Номер | 101, Standard, до 2 гостей, 3 500 сом за ночь |
| Первая бронь | Гость Анна: заезд **1 июня**, выезд **5 июня** → 4 ночи, 14 000 сом |
| Вторая бронь | Гость Борис: заезд **5 июня**, выезд **8 июня** → 3 ночи, 10 500 сом — **разрешено**, это стык |
| Третья попытка | Гость Вера: заезд **4 июня**, выезд **7 июня** → **отказ**, ночи 4–5 июня заняты |

### 2.3 Основные возможности

| Для кого | Возможности |
| --- | --- |
| Посетитель | Поиск отелей, страница отеля, список номеров, расчёт цены |
| Гость | Бронирование, мои бронирования (предстоящие, текущие, прошедшие, отменённые), отмена, отзыв, профиль |
| Менеджер | Правка отеля, номера и цены, закрытие номера на период, список броней своих отелей |

### 2.4 Система на одной схеме

```mermaid
flowchart LR
    V["Гость или менеджер<br/>(браузер)"] --> F["React-сайт"]
    F -- "JSON, cookie" --> B["Сервер Express"]
    B -- "SQL" --> D[("PostgreSQL")]
    B -. "логи" .-> L["Файлы и консоль логов"]
```

### 2.5 Сквозной сценарий: от поиска до отзыва

```mermaid
flowchart TD
    S1["1. Поиск: Бишкек, 1–5 июня, 2 гостя"] --> S2["2. Выбор отеля Ала-Тоо"]
    S2 --> S3["3. Выбор номера 101"]
    S3 --> S4["4. Расчёт: 4 ночи × 3500 = 14000 сом"]
    S4 --> S5{"Гость вошёл?"}
    S5 -- нет --> S6["Вход или регистрация"] --> S7
    S5 -- да --> S7["5. Подтверждение брони"]
    S7 --> S8["6. Бронь SB-K7M2QX, статус подтверждена"]
    S8 --> S9{"7. Планы изменились?"}
    S9 -- "до заезда" --> S10["Отмена: бронь в истории, номер свободен"]
    S9 -- "нет" --> S11["Проживание"]
    S11 --> S12["8. После выезда: отзыв 1–5"]
```

### 2.6 Какие действия есть в системе и что каждое делает

| Действие | Кто | Что происходит в базе |
| --- | --- | --- |
| Регистрация | Посетитель | Новая строка в `users` |
| Поиск | Все | Только чтение: `hotels`, `rooms`, `bookings`, `room_closures` |
| Расчёт цены | Все | Только чтение, ничего не сохраняется |
| Подтвердить бронь | Гость | Новая строка в `bookings` в транзакции |
| Отменить бронь | Гость | `status = cancelled`, `cancelled_at = now()` |
| Оставить отзыв | Гость | Новая строка в `reviews` |
| Создать или изменить отель, номер | Менеджер | `hotels`, `rooms`, `hotel_managers` |
| Закрыть номер | Менеджер | Новая строка в `room_closures` |

---

## 3. Требования

Каждому пункту ТЗ присвоен номер вида `FR-<группа>.<пункт>`, чтобы ссылаться на него в тестах и коде.

### 3.1 Функциональные требования

| ID | Пункт ТЗ | Где реализовано |
| --- | --- | --- |
| FR-1.1 | Регистрация: имя, email, пароль | `POST /api/auth/signup`, таблица `users` |
| FR-1.2 | Вход, выход, профиль | `POST /api/auth/signin`, `/signout`, `GET /api/auth/profile` |
| FR-1.3 | Гость видит только свои брони; менеджер — только свои отели | Проверки владельца в SQL (раздел 4.3) |
| FR-2.1 | Поиск по городу, датам, числу гостей | `GET /api/hotels` |
| FR-2.2 | Только отели с подходящим свободным номером на весь период | Запрос 11.4 |
| FR-2.3 | В результате: название, город, описание, минимальная цена | Ответ `GET /api/hotels` |
| FR-2.4 | Страница отеля: описание, адрес, удобства, номера | `GET /api/hotels/:hotelId` |
| FR-3.1 | У номера: номер, тип, вместимость, описание, цена | Таблица `rooms` |
| FR-3.2 | Гость видит подходящие и свободные номера | `GET /api/hotels/:hotelId/rooms` |
| FR-3.3 | Пересечение с подтверждённой бронью → номер недоступен | Раздел 11 |
| FR-3.4 | День выезда не занят | Интервал `[заезд, выезд)` |
| FR-4.1 | Вошедший гость выбирает номер, даты, число гостей | Страница отеля → подтверждение |
| FR-4.2 | Перед подтверждением — ночи, цена за ночь, итог | `GET /api/rooms/:roomId/quote` |
| FR-4.3 | Подтверждение → уникальный номер брони, статус «подтверждено» | `POST /api/bookings` |
| FR-4.4 | Два гостя не получают один номер на пересекающиеся ночи даже при гонке | Раздел 14 |
| FR-4.5 | Цена фиксируется за бронью | Колонка `bookings.price_per_night` |
| FR-5.1 | Предстоящие, текущие, прошедшие, отменённые | `GET /api/bookings?view=` |
| FR-5.2 | Детали брони | `GET /api/bookings/:id` |
| FR-5.3 | Отмена до даты заезда | `POST /api/bookings/:id/cancel` |
| FR-5.4 | Отмена освобождает номер | Ограничение действует только для `confirmed` |
| FR-5.5 | Отменённая бронь остаётся в истории | Статус `cancelled`, строка не удаляется |
| FR-6.1 | Оценка 1–5 и текст после выезда | `POST /api/bookings/:id/review` |
| FR-6.2 | Не более одного отзыва на бронь | `UNIQUE (booking_id)` |
| FR-6.3 | Отзывы и рейтинг на странице отеля | `GET /api/hotels/:hotelId`, `/reviews` |
| FR-6.4 | Отменённые и будущие брони нельзя оценить | Условие в запросе 10.6 |
| FR-7.1 | Менеджер редактирует описание, расположение, удобства | `POST/PATCH /api/manage/hotels` |
| FR-7.2 | Номера: добавить, изменить, менять цену для будущих броней | `/api/manage/hotels/:hotelId/rooms`, `PATCH /api/manage/rooms/:roomId` |
| FR-7.3 | Закрытие номера на период | `/api/manage/rooms/:roomId/closures` |
| FR-7.4 | Менеджер видит брони своих отелей | `GET /api/manage/hotels/:hotelId/bookings` |
| FR-7.5 | Нельзя сделать будущие брони недействительными | Раздел 10.8 |

### 3.2 Бизнес-правила

| ID | Правило | Где обеспечено |
| --- | --- | --- |
| BR-1 | Доступность проверяется на весь период | Оператор `&&` над `daterange` (раздел 11) |
| BR-2 | Заезд — сегодня или позже, выезд позже заезда, минимум одна ночь | zod + `CHECK (check_out > check_in)` |
| BR-3 | Гостей от 1 до вместимости номера | Валидация + проверка в сервисе |
| BR-4 | Итог = цена за ночь × число ночей; смена цены влияет только на новые брони | Generated-колонка `total_price`, снимок цены |
| BR-5 | Отменять можно только подтверждённые будущие брони; отменённые не блокируют номер | Условие в `UPDATE` + частичное ограничение |
| BR-6 | Отель в поиске — только при наличии подходящего свободного номера | Запрос 11.4 |

### 3.3 Требования к интерфейсу

| ID | Требование ТЗ | Решение |
| --- | --- | --- |
| UX-1 | Экраны: вход и регистрация, поиск, результаты, отель, выбор номера, подтверждение, мои бронирования | Раздел 17.1 |
| UX-2 | Отдельный раздел менеджера | Маршруты `/manage/*` |
| UX-3 | Формы объясняют, что не так | Ошибки по полям (`fields`) под полями формы |
| UX-4 | Понятное сообщение, если номер стал недоступен | Код `ROOM_NOT_AVAILABLE` + обновление списка номеров |
| UX-5 | Удобно на компьютере и телефоне | Адаптивная вёрстка от 360 px |

---

## 4. Роли и права доступа

### 4.1 Роли

| Роль | Кто | Что может |
| --- | --- | --- |
| Посетитель | Без входа | Поиск, просмотр отелей, номеров, отзывов, расчёт цены |
| `guest` | Зарегистрированный гость | Всё выше + брони, отмена, отзывы, профиль |
| `manager` | Менеджер отеля | Просмотр как у посетителя + кабинет `/manage` по своим отелям |

### 4.2 Матрица прав

✅ — можно, 🔸 — только своё, ❌ — нельзя

| Действие | Посетитель | Гость | Менеджер |
| --- | :---: | :---: | :---: |
| Поиск, отель, номера, расчёт цены | ✅ | ✅ | ✅ |
| Создать бронь | ❌ | ✅ | ❌ |
| Смотреть, отменять бронь, оставлять отзыв | ❌ | 🔸 | ❌ |
| Профиль | ❌ | ✅ | ✅ |
| Редактировать отель, номера, цены | ❌ | ❌ | 🔸 |
| Закрывать номера | ❌ | ❌ | 🔸 |
| Смотреть брони отеля | ❌ | ❌ | 🔸 |

### 4.3 Как проверяются права

```
запрос → authenticate (токен?) → requireRole (роль?) → проверка владельца в SQL → действие
```

1. `authenticate` читает cookie и проверяет JWT; нет или недействителен → `401`.
2. `requireRole('manager')` стоит на `/api/manage/*`; не менеджер → `403`.
3. Владелец проверяется **внутри SQL-запроса**: чужой объект выглядит как несуществующий (`404`).

```sql
-- номер доступен менеджеру, только если он назначен на отель этого номера
SELECT r.*
  FROM rooms r
  JOIN hotel_managers hm ON hm.hotel_id = r.hotel_id AND hm.user_id = $2
 WHERE r.id = $1;

-- бронь доступна гостю, только если она его
SELECT * FROM bookings WHERE id = $1 AND guest_id = $2;
```

---

## 5. Архитектура системы

### 5.1 Почему монолит

| Критерий | Монолит | Микросервисы |
| --- | --- | --- |
| Бронь — одна транзакция в одной базе | ✅ | ❌ нужны распределённые транзакции |
| Запуск и демонстрация | ✅ `npm run dev` | ❌ несколько сервисов |
| Объём проекта (7 таблиц) | ✅ достаточно | ❌ избыточно |
| Развитие | Модули можно вынести позже | Сразу сложно |

### 5.2 Общая схема

```mermaid
flowchart LR
    subgraph Client["Браузер"]
        SPA["React SPA"]
    end
    subgraph Server["Сервер Node.js + Express"]
        HTTP["HTTP-слой: маршруты, проверка входа и ролей, валидация"]
        SVC["Сервисы: бизнес-правила и транзакции"]
        SQL["SQL-запросы через pg"]
        HTTP --> SVC --> SQL
    end
    DB[("PostgreSQL")]
    SPA -- "JSON по HTTPS, cookie с токеном" --> HTTP
    SQL -- "SQL" --> DB
```

В продакшене Express раздаёт собранный React из `client/dist`: сайт и API живут на одном адресе, cookie работает без настройки CORS.

### 5.3 Путь одного запроса (бронирование)

```mermaid
sequenceDiagram
    actor G as Гость
    participant UI as React
    participant API as Express
    participant DB as PostgreSQL
    G->>UI: Нажимает Подтвердить
    UI->>API: POST /api/bookings (cookie)
    API->>API: authenticate, requireRole, zod
    API->>DB: BEGIN, блокировка номера, проверки, INSERT
    DB-->>API: строка брони
    API->>DB: COMMIT
    API-->>UI: 201 бронирование
    UI-->>G: Страница брони с номером SB-...
```

### 5.4 Компоненты

| Компонент | Задача |
| --- | --- |
| React-приложение | Экраны, формы, показ ошибок |
| HTTP-слой | Разбор запроса, проверка токена и роли, валидация, формат ответа |
| Сервисы | Правила бронирования, транзакции, проверка прав на объект |
| SQL-запросы | Чтение и запись данных |
| PostgreSQL | Хранение, защита от двойной брони |
| Логгер | Запись событий и ошибок |

---

## 6. Технологический стек

### 6.1 Основное

| Область | Выбор | Назначение |
| --- | --- | --- |
| Язык | TypeScript 5 | Типы на клиенте и сервере |
| Runtime | Node.js 24 LTS | Сервер |
| Сервер | Express 5 | Маршруты; ошибки из `async`-обработчиков перехватываются без доп. пакетов |
| База | PostgreSQL 16+ | Данные, `EXCLUDE`, `daterange` |
| Клиент | React 18 + Vite | Интерфейс |

### 6.2 Библиотеки Frontend

| Библиотека | Назначение |
| --- | --- |
| React Router | Маршруты и защита страниц |
| TanStack Query | Загрузка данных, кэш, обновление после действий |
| React Hook Form + zod | Формы и проверка |
| Tailwind CSS | Адаптивная вёрстка |
| date-fns | Работа с датами |

### 6.3 Библиотеки Backend

| Библиотека | Назначение |
| --- | --- |
| `pg` | Драйвер PostgreSQL и пул соединений |
| `node-pg-migrate` | Миграции схемы SQL-файлами |
| zod | Проверка входных данных |
| bcrypt | Хэш паролей |
| jsonwebtoken | JWT |
| helmet | Безопасные HTTP-заголовки |
| express-rate-limit | Лимит попыток входа |
| pino, pino-http | JSON-логи |
| cookie-parser | Чтение cookie |

### 6.4 Инструменты

| Инструмент | Назначение |
| --- | --- |
| VS Code | Редактор |
| Vitest, Supertest, Playwright | Тесты |
| ESLint, Prettier | Стиль кода |
| GitHub Actions | Автоматические тесты |
| Postman или REST-клиент в VS Code | Ручная проверка API |
| Docker (по желанию) | Локальная база |

### 6.5 Почему выбраны эти технологии

| Выбор | Причина |
| --- | --- |
| PostgreSQL | Единственный из привычных вариантов с `EXCLUDE` по диапазонам дат |
| `pg` вместо ORM | `EXCLUDE`, `daterange` и generated-колонки пишутся напрямую; запросы видны целиком |
| TypeScript | Ошибки типов ловятся до запуска |
| zod | Одни и те же схемы можно использовать на клиенте и сервере |
| TanStack Query | Не нужно вручную хранить и обновлять данные сервера |
| Express 5 | Простой, известный; обработка async-ошибок встроена |

---

## 7. Архитектура Backend

### 7.1 Два слоя

| Слой | Ответственность | Чего не делает |
| --- | --- | --- |
| HTTP | Разбор запроса, токен и роль, zod, формирование ответа и ошибки | Не содержит бизнес-правил |
| Сервис | Правила бронирования, расчёт цены, транзакции, права на объект | Не знает про `req`/`res` |

SQL лежит рядом с сервисом в файле `*.sql.ts`: запрос и код, который его вызывает, читаются вместе.

### 7.2 Модули

| Модуль | Содержание |
| --- | --- |
| `auth` | Регистрация, вход, выход, профиль |
| `catalog` | Поиск отелей, страница отеля, номера, quote, отзывы отеля |
| `bookings` | Создание, список, просмотр, отмена |
| `reviews` | Создание отзыва |
| `manage` | Кабинет менеджера: отели, номера, закрытия, брони отеля |

### 7.3 Структура папок

```
staybook/
├── client/                       # React + Vite
│   └── src/
│       ├── api/                  # обёртки над fetch
│       ├── pages/                # страницы по маршрутам
│       ├── components/           # карточки, формы, диалоги
│       ├── features/             # хуки TanStack Query по областям
│       ├── auth/                 # контекст пользователя
│       └── main.tsx
├── server/
│   ├── migrations/               # SQL-миграции
│   ├── scripts/seed.ts           # тестовые данные
│   ├── src/
│   │   ├── app.ts                # сборка Express
│   │   ├── server.ts             # запуск
│   │   ├── config.ts             # чтение .env
│   │   ├── db.ts                 # пул соединений, withTransaction
│   │   ├── http/                 # middleware: auth, roles, validate, errors
│   │   ├── lib/                  # даты, номер брони, ошибки
│   │   └── modules/
│   │       ├── auth/
│   │       ├── catalog/
│   │       ├── bookings/
│   │       ├── reviews/
│   │       └── manage/           # в каждом: routes, service, schemas, *.sql.ts
│   └── tests/
├── .env.example
├── .gitignore
└── README.md
```

### 7.4 Пример модуля: отмена брони

```ts
// modules/bookings/bookings.routes.ts
router.post('/:id/cancel', authenticate, requireRole('guest'), async (req, res) => {
  const booking = await bookingsService.cancel(req.user.id, Number(req.params.id));
  res.json(booking);
});

// modules/bookings/bookings.service.ts
export async function cancel(guestId: number, bookingId: number) {
  const today = todayInAppTz();
  const row = await db.maybeOne(SQL.cancel, [bookingId, guestId, today]);
  if (row) return toBookingDto(row, today);

  // 0 строк: выясняем причину, чтобы дать точный ответ
  const b = await db.maybeOne(SQL.findOwn, [bookingId, guestId]);
  if (!b) throw new AppError('NOT_FOUND');
  if (b.status === 'cancelled') throw new AppError('BOOKING_ALREADY_CANCELLED');
  throw new AppError('BOOKING_ALREADY_STARTED');
}
```

### 7.5 Сборка приложения (`app.ts`)

```ts
export function buildApp() {
  const app = express();
  app.use(helmet());
  app.use(pinoHttp({ logger }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRoutes);
  app.use('/api/hotels', catalogRoutes);
  app.use('/api/rooms', quoteRoutes);
  app.use('/api/bookings', bookingsRoutes);
  app.use('/api/manage', authenticate, requireRole('manager'), manageRoutes);

  app.use('/api', (_req, _res, next) => next(new AppError('NOT_FOUND')));
  app.use(errorHandler);          // последним
  return app;
}
```

### 7.6 Работа с базой

```ts
// db.ts
export const pool = new Pool({ connectionString: config.databaseUrl });

export async function withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(wrap(client));
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
```

`wrap` добавляет методы `one`, `maybeOne`, `many`, `exists` поверх `client.query`. Все значения передаются параметрами (`$1`, `$2`…), строки в SQL никогда не склеиваются.

---

## 8. Проектирование базы данных

### 8.1 Главная идея

Проживание хранится как диапазон ночей `[check_in, check_out)`. Главное правило системы — «у одного номера не бывает двух подтверждённых броней с пересекающимися ночами» — записано **в самой базе** (`EXCLUDE`), а не только в коде. Число ночей и итог база вычисляет сама, поэтому они не могут разойтись с датами и ценой.

### 8.2 ER-диаграмма

```mermaid
erDiagram
    USERS ||--o{ BOOKINGS : "оформляет"
    USERS ||--o{ HOTEL_MANAGERS : "назначен"
    HOTELS ||--o{ HOTEL_MANAGERS : "управляется"
    HOTELS ||--o{ ROOMS : "содержит"
    ROOMS ||--o{ BOOKINGS : "бронируется"
    ROOMS ||--o{ ROOM_CLOSURES : "закрывается на период"
    BOOKINGS ||--o| REVIEWS : "получает отзыв"

    USERS {
        bigint id PK
        text full_name
        text email UK
        text password_hash
        enum role "guest или manager"
        timestamptz created_at
    }
    HOTELS {
        bigint id PK
        text name
        text city
        text address
        text short_description
        text description
        text amenities "массив строк"
        boolean is_published
    }
    HOTEL_MANAGERS {
        bigint hotel_id PK
        bigint user_id PK
    }
    ROOMS {
        bigint id PK
        bigint hotel_id FK
        text number "101"
        text room_type
        smallint capacity
        text description
        integer price_per_night "сомы"
        boolean is_active
    }
    ROOM_CLOSURES {
        bigint id PK
        bigint room_id FK
        daterange period
        text reason
        bigint created_by FK
    }
    BOOKINGS {
        bigint id PK
        text reference UK "SB-K7M2QX"
        bigint guest_id FK
        bigint room_id FK
        date check_in
        date check_out
        smallint guests
        integer price_per_night "снимок цены"
        integer nights "вычисляется"
        integer total_price "вычисляется"
        daterange stay "вычисляется"
        enum status "confirmed или cancelled"
        timestamptz created_at
        timestamptz cancelled_at
    }
    REVIEWS {
        bigint id PK
        bigint booking_id FK
        smallint rating "1..5"
        text comment
        timestamptz created_at
    }
```

### 8.3 Связи текстом

| Связь | Тип | Смысл |
| --- | --- | --- |
| `users` → `bookings` | 1 : N | Гость делает много броней |
| `hotels` ↔ `users` через `hotel_managers` | N : M | У отеля может быть несколько менеджеров, менеджер ведёт несколько отелей |
| `hotels` → `rooms` | 1 : N | В отеле много номеров |
| `rooms` → `bookings` | 1 : N | Номер бронируется много раз (но не на пересекающиеся ночи) |
| `rooms` → `room_closures` | 1 : N | Номер можно закрывать несколько раз |
| `bookings` → `reviews` | 1 : 0..1 | Не более одного отзыва на бронь |

Отель в брони не дублируется: он определяется через `booking → room → hotel`. Зафиксированы только данные, влияющие на деньги и даты: цена за ночь, даты, число гостей.

### 8.4 Описание таблиц

| Таблица | Что хранит | Замечание |
| --- | --- | --- |
| `users` | Гости и менеджеры | Email в нижнем регистре, уникален |
| `hotels` | Отели | Не удаляются: `is_published = false` скрывает из поиска |
| `hotel_managers` | Кто какими отелями управляет | Основа проверки «только свои отели» |
| `rooms` | Номера | Не удаляются: `is_active = false` |
| `room_closures` | Периоды, когда номер закрыт | Периоды одного номера не пересекаются |
| `bookings` | Брони | Снимок цены; ночи, итог и интервал вычисляет база |
| `reviews` | Отзывы | Один на бронь |

### 8.5 Что гарантирует база, а что — приложение

| Инвариант | Кто следит |
| --- | --- |
| Один номер не имеет двух подтверждённых броней с пересекающимися ночами | **База** (`EXCLUDE`) |
| Выезд позже заезда; гостей ≥ 1; оценка 1–5; один отзыв на бронь | **База** (`CHECK`, `UNIQUE`) |
| Итог = цена за ночь × ночи | **База** (generated-колонка) |
| Бронь не пересекается с закрытием номера | **Приложение** под блокировкой строки номера (раздел 14.3) |
| Заезд не в прошлом, гостей не больше вместимости | **Приложение** (зависит от текущей даты и данных номера) |
| Нельзя деактивировать номер с будущими бронями | **Приложение** под блокировкой строки номера |

### 8.6 Индексы

| Индекс | Зачем |
| --- | --- |
| `hotels (lower(city)) WHERE is_published` | Поиск по городу |
| `rooms (hotel_id)` | Номера отеля |
| `bookings (guest_id, check_in DESC)` | «Мои бронирования» |
| `bookings (room_id, check_in)` | Брони номера |
| Индекс `EXCLUDE` по `(room_id, stay)` | Создаётся автоматически; ускоряет проверку доступности, если в запросе есть `status = 'confirmed'` |
| `room_closures (room_id)` | Закрытия номера |

### 8.7 SQL создания схемы

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;  -- нужно для EXCLUDE по обычным числам

CREATE TYPE user_role      AS ENUM ('guest', 'manager');
CREATE TYPE booking_status AS ENUM ('confirmed', 'cancelled');

CREATE TABLE users (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name     text        NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  email         text        NOT NULL CHECK (email = lower(email)),
  password_hash text        NOT NULL,
  role          user_role   NOT NULL DEFAULT 'guest',
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_key UNIQUE (email)
);

CREATE TABLE hotels (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name              text    NOT NULL CHECK (char_length(name) BETWEEN 2 AND 150),
  city              text    NOT NULL,
  address           text    NOT NULL,
  short_description text    NOT NULL CHECK (char_length(short_description) <= 200),
  description       text,
  amenities         text[]  NOT NULL DEFAULT '{}',
  is_published      boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX hotels_city_idx ON hotels (lower(city)) WHERE is_published;

CREATE TABLE hotel_managers (
  hotel_id bigint NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  user_id  bigint NOT NULL REFERENCES users(id),
  PRIMARY KEY (hotel_id, user_id)
);

CREATE TABLE rooms (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  hotel_id        bigint   NOT NULL REFERENCES hotels(id),
  number          text     NOT NULL,
  room_type       text     NOT NULL,
  capacity        smallint NOT NULL CHECK (capacity BETWEEN 1 AND 20),
  description     text,
  price_per_night integer  NOT NULL CHECK (price_per_night >= 0),
  is_active       boolean  NOT NULL DEFAULT true,
  CONSTRAINT rooms_hotel_number_key UNIQUE (hotel_id, number)
);

CREATE TABLE room_closures (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id    bigint    NOT NULL REFERENCES rooms(id),
  period     daterange NOT NULL CHECK (NOT isempty(period)),   -- закрытые ночи [с, по)
  reason     text,
  created_by bigint    NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT room_closures_no_overlap EXCLUDE USING gist (room_id WITH =, period WITH &&)
);

CREATE TABLE bookings (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  reference       text     NOT NULL,
  guest_id        bigint   NOT NULL REFERENCES users(id),
  room_id         bigint   NOT NULL REFERENCES rooms(id),
  check_in        date     NOT NULL,
  check_out       date     NOT NULL,
  guests          smallint NOT NULL CHECK (guests >= 1),
  price_per_night integer  NOT NULL CHECK (price_per_night >= 0),   -- снимок цены на момент брони
  nights          integer  GENERATED ALWAYS AS (check_out - check_in) STORED,
  total_price     integer  GENERATED ALWAYS AS ((check_out - check_in) * price_per_night) STORED,
  stay            daterange GENERATED ALWAYS AS (daterange(check_in, check_out, '[)')) STORED,
  status          booking_status NOT NULL DEFAULT 'confirmed',
  created_at      timestamptz NOT NULL DEFAULT now(),
  cancelled_at    timestamptz,
  CONSTRAINT bookings_reference_key UNIQUE (reference),
  CONSTRAINT bookings_dates_check   CHECK (check_out > check_in),

  -- ГЛАВНОЕ ПРАВИЛО: у одного номера не бывает двух подтверждённых броней
  -- с пересекающимися ночами. Отменённые брони в проверке не участвуют.
  CONSTRAINT bookings_no_overlap EXCLUDE USING gist (room_id WITH =, stay WITH &&)
    WHERE (status = 'confirmed')
);

CREATE TABLE reviews (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id bigint   NOT NULL REFERENCES bookings(id),
  rating     smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    text     CHECK (char_length(comment) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_booking_id_key UNIQUE (booking_id)
);

CREATE INDEX rooms_hotel_idx          ON rooms (hotel_id);
CREATE INDEX bookings_guest_idx       ON bookings (guest_id, check_in DESC);
CREATE INDEX bookings_room_idx        ON bookings (room_id, check_in);
CREATE INDEX room_closures_room_idx   ON room_closures (room_id);
```

### 8.8 Пример данных: что лежит в базе для «Ала-Тоо»

| Таблица | Строки |
| --- | --- |
| `hotels` | 1 · «Ала-Тоо» · Бишкек |
| `rooms` | 1 · 101 · Standard · 2 · 3500; 2 · 102 · Standard · 2 · 3500 |
| `bookings` | SB-AAAAAA · Анна · комната 1 · 1–5 июня · 4 ночи · 14 000 · confirmed |
| | SB-BBBBBB · Борис · комната 1 · 5–8 июня · 3 ночи · 10 500 · confirmed |
| `reviews` | брони SB-BBBBBB · 5 · «Чисто и тихо» |

### 8.9 Миграции и работа со схемой

Схема создаётся и меняется только SQL-файлами в `server/migrations` (`node-pg-migrate`): `npm run db:migrate` применяет новые файлы по порядку. Вручную в рабочей базе схему не меняют. Тестовые данные лежат отдельно в `server/scripts/seed.ts`.

---

## 9. Проектирование API

### 9.1 Общие правила

| Тема | Правило |
| --- | --- |
| Префикс | Все адреса начинаются с `/api` |
| Формат | JSON, поля в `camelCase` |
| Вход | Cookie `token` (`httpOnly`), ставится при входе и регистрации |
| Даты | `YYYY-MM-DD` |
| Деньги | Целые сомы, поле `currency` всегда `KGS` |
| Списки | `page` (с 1) и `pageSize` (по умолчанию 20, максимум 50) |
| Ошибки | Единый формат (9.7) |

### 9.2 Список эндпоинтов

| Метод | Адрес | Кто | Назначение |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | Все | Регистрация |
| POST | `/api/auth/signin` | Все | Вход |
| POST | `/api/auth/signout` | Вошедший | Выход |
| GET | `/api/auth/profile` | Вошедший | Профиль |
| GET | `/api/hotels` | Все | Поиск отелей |
| GET | `/api/hotels/:hotelId` | Все | Страница отеля |
| GET | `/api/hotels/:hotelId/rooms` | Все | Номера на даты |
| GET | `/api/hotels/:hotelId/reviews` | Все | Отзывы отеля (постранично) |
| GET | `/api/rooms/:roomId/quote` | Все | Расчёт: ночи, цена, итог, доступность |
| POST | `/api/bookings` | Гость | Подтвердить бронь |
| GET | `/api/bookings` | Гость | Мои бронирования |
| GET | `/api/bookings/:id` | Владелец | Одна бронь |
| POST | `/api/bookings/:id/cancel` | Владелец | Отмена |
| POST | `/api/bookings/:id/review` | Владелец | Отзыв |
| GET | `/api/manage/hotels` | Менеджер | Мои отели |
| POST | `/api/manage/hotels` | Менеджер | Создать отель |
| PATCH | `/api/manage/hotels/:hotelId` | Менеджер отеля | Изменить отель |
| GET | `/api/manage/hotels/:hotelId/rooms` | Менеджер отеля | Номера отеля |
| POST | `/api/manage/hotels/:hotelId/rooms` | Менеджер отеля | Добавить номер |
| PATCH | `/api/manage/rooms/:roomId` | Менеджер отеля | Изменить номер, цену, активность |
| GET | `/api/manage/rooms/:roomId/closures` | Менеджер отеля | Закрытия номера |
| POST | `/api/manage/rooms/:roomId/closures` | Менеджер отеля | Закрыть номер на период |
| DELETE | `/api/manage/closures/:closureId` | Менеджер отеля | Снять закрытие |
| GET | `/api/manage/hotels/:hotelId/bookings` | Менеджер отеля | Брони отеля |
| GET | `/api/health` | Все | Проверка работоспособности |

### 9.3 Аутентификация

`POST /api/auth/signup`

```json
{ "fullName": "Анна Нова", "email": "anna@example.com", "password": "secret123", "isHotelManager": false }
```

| Поле | Правило |
| --- | --- |
| fullName | 2–100 символов |
| email | корректный адрес, приводится к нижнему регистру |
| password | не короче 8 символов, есть буква и цифра |
| isHotelManager | необязательно; `true` → роль `manager` (допущение A1) |

Ответ `201` + cookie: `{ "id": 5, "fullName": "Анна Нова", "email": "anna@example.com", "role": "guest" }`. Ошибки: `VALIDATION_FAILED`, `EMAIL_IN_USE`.

`POST /api/auth/signin` — `{ "email", "password" }` → `200` с теми же полями. Неверный email или пароль — всегда одинаковая `BAD_CREDENTIALS`.
`POST /api/auth/signout` → `204`, cookie удаляется. `GET /api/auth/profile` → `200` с профилем и `createdAt`, либо `UNAUTHORIZED`.

### 9.4 Поиск и отели

**`GET /api/hotels?city=Бишкек&checkIn=2026-12-01&checkOut=2026-12-05&guests=2`**

| Параметр | Обязательно | Описание |
| --- | :---: | --- |
| city | ✅ | Город (без учёта регистра) |
| checkIn, checkOut | ✅ | Даты проживания |
| guests | ✅ | Число гостей ≥ 1 |
| sort | | `price` (по умолчанию) или `rating` — необязательная сортировка из ТЗ |

```json
{
  "items": [
    { "id": 1, "name": "Ала-Тоо", "city": "Бишкек",
      "shortDescription": "Отель рядом с площадью Ала-Тоо",
      "fromPrice": 3500, "currency": "KGS", "avgRating": 4.6, "reviewsCount": 12 }
  ]
}
```

Нет подходящих отелей → `200` и пустой массив. Ошибки: `VALIDATION_FAILED`, `DATES_INVALID`.

**`GET /api/hotels/:hotelId`** — описание, адрес, удобства, рейтинг, первые отзывы и список номеров (без проверки доступности).
**`GET /api/hotels/:hotelId/rooms?checkIn=&checkOut=&guests=`** — свободные и вмещающие группу номера; с `includeUnavailable=true` вернёт и остальные с полем `available` (допущение A11).

**`GET /api/rooms/:roomId/quote?checkIn=&checkOut=&guests=`**

```json
{
  "roomId": 3, "hotelName": "Ала-Тоо", "roomNumber": "101",
  "checkIn": "2026-12-01", "checkOut": "2026-12-05", "guests": 2,
  "nights": 4, "pricePerNight": 3500, "totalPrice": 14000, "currency": "KGS",
  "available": true, "unavailableReason": null
}
```

`unavailableReason` — `BOOKED`, `CLOSED`, `CAPACITY` или `null`. Это то, что ТЗ требует показать до подтверждения.

### 9.5 Бронирования и отзывы

**`POST /api/bookings`**

```json
{ "roomId": 3, "checkIn": "2026-12-01", "checkOut": "2026-12-05", "guests": 2, "expectedTotal": 14000 }
```

```json
{
  "id": 41, "reference": "SB-K7M2QX", "status": "confirmed", "phase": "upcoming",
  "hotel": { "id": 1, "name": "Ала-Тоо", "city": "Бишкек" },
  "room":  { "id": 3, "number": "101", "type": "Standard" },
  "checkIn": "2026-12-01", "checkOut": "2026-12-05", "nights": 4, "guests": 2,
  "pricePerNight": 3500, "totalPrice": 14000, "currency": "KGS",
  "canCancel": true, "canReview": false, "createdAt": "2026-11-21T17:15:00Z"
}
```

Ошибки: `VALIDATION_FAILED`, `DATES_INVALID`, `GUESTS_OVER_CAPACITY`, `UNAUTHORIZED`, `NOT_FOUND`, `QUOTE_CHANGED`, `ROOM_NOT_AVAILABLE`.

**`GET /api/bookings?view=upcoming|current|past|cancelled`** — свои брони (без `view` — все); предстоящие сортируются по дате заезда, остальные — от новых к старым.
**`POST /api/bookings/:id/cancel`** → бронь со статусом `cancelled`.
**`POST /api/bookings/:id/review`** — `{ "rating": 5, "comment": "Чисто и тихо" }` → `201`.

### 9.6 Кабинет менеджера

`POST /api/manage/hotels`

```json
{ "name": "Ала-Тоо", "city": "Бишкек", "address": "пр. Чуй, 100",
  "shortDescription": "Отель рядом с площадью", "description": "…", "amenities": ["wifi", "parking"] }
```

`POST /api/manage/hotels/:hotelId/rooms` — `{ "number": "101", "roomType": "Standard", "capacity": 2, "pricePerNight": 3500, "description": "…" }`. Ошибка: `ROOM_NUMBER_TAKEN`.

`PATCH /api/manage/rooms/:roomId` — любые из полей `roomType`, `capacity`, `description`, `pricePerNight`, `isActive`. Правила — раздел 10.8.

`POST /api/manage/rooms/:roomId/closures` — `{ "from": "2026-12-20", "to": "2026-12-22", "reason": "Ремонт сантехники" }` → `201`. Период — закрытые **ночи** `[from, to)`. Ошибки: `DATES_INVALID`, `ROOM_HAS_BOOKINGS`, `CLOSURE_OVERLAP`.

`GET /api/manage/hotels/:hotelId/bookings?status=&roomId=&checkInFrom=&checkInTo=&q=&page=&pageSize=` — брони отеля; в каждой строке имя и email гостя.

### 9.7 Формат ошибки

```json
{ "code": "ROOM_NOT_AVAILABLE", "message": "Этот номер уже занят на выбранные даты. Выберите другие даты или номер." }
```

Для ошибок валидации добавляется объект `fields` — по нему форма показывает подсказку у нужного поля (UX-3):

```json
{ "code": "VALIDATION_FAILED", "message": "Проверьте введённые данные",
  "fields": { "email": "Неверный формат email", "password": "Не короче 8 символов, нужны буква и цифра" } }
```

---

## 10. Бизнес-логика

Текущая дата во всех правилах — «сегодня» в часовом поясе `APP_TIMEZONE` (допущение A5). Её считает одна функция `todayInAppTz()`.

### 10.1 Поиск отелей

1. Проверить параметры (город, даты, гости) — иначе `VALIDATION_FAILED` / `DATES_INVALID`.
2. Выбрать активные номера нужной вместимости, свободные на все ночи (нет пересекающихся `confirmed`-броней и закрытий).
3. Оставить опубликованные отели города, у которых есть хотя бы один такой номер.
4. Для каждого отеля взять минимальную цену среди подходящих номеров и средний рейтинг.
5. Отсортировать (по умолчанию по цене) и вернуть. SQL — в разделе 11.4.

### 10.2 Расчёт цены

```
ночи = выезд − заезд (в днях)
итог = ночи × цена за ночь
```

Пример: 1–5 июня, 3 500 сом → 4 × 3 500 = **14 000 сом**. Расчёт всегда делает сервер; клиент только показывает результат.

### 10.3 Бронирование номера

Порядок проверок в сервисе:

1. Даты корректны (BR-2) → иначе `DATES_INVALID`.
2. Номер существует и активен → иначе `NOT_FOUND`.
3. Гостей не больше вместимости (BR-3) → иначе `GUESTS_OVER_CAPACITY`.
4. Итог = ночи × цена номера (BR-4); не совпал с `expectedTotal` → `QUOTE_CHANGED` (цена изменилась, пока гость думал).
5. Нет пересечения с закрытием → иначе `ROOM_NOT_AVAILABLE`.
6. `INSERT`; пересечение с чужой бронью ловит `EXCLUDE` → `ROOM_NOT_AVAILABLE`.

```ts
export async function createBooking(guestId: number, input: CreateBookingInput) {
  const { roomId, checkIn, checkOut, guests, expectedTotal } = input;
  assertStayDates(checkIn, checkOut);                         // BR-2

  return withTransaction(async (tx) => {
    const room = await tx.maybeOne(SQL.lockRoomShared, [roomId]);   // ... FROM rooms WHERE id = $1 FOR SHARE
    if (!room || !room.is_active) throw new AppError('NOT_FOUND');
    if (guests > room.capacity) throw new AppError('GUESTS_OVER_CAPACITY');   // BR-3

    const total = nightsBetween(checkIn, checkOut) * room.price_per_night;    // BR-4
    if (expectedTotal !== undefined && expectedTotal !== total)
      throw new AppError('QUOTE_CHANGED', { newTotal: total });

    if (await tx.exists(SQL.closureOverlaps, [roomId, checkIn, checkOut]))
      throw new AppError('ROOM_NOT_AVAILABLE');

    try {
      return await tx.one(SQL.insertBooking,
        [newReference(), guestId, roomId, checkIn, checkOut, guests, room.price_per_night]);
    } catch (e) {
      if (isConstraint(e, 'bookings_no_overlap')) throw new AppError('ROOM_NOT_AVAILABLE');
      throw e;
    }
  });
}
```

`isConstraint` сравнивает код ошибки `23P01` и имя ограничения.

### 10.4 Номер брони

Формат `SB-` + 6 символов из алфавита без похожих знаков (`0/O`, `1/I`); случайность — `crypto.randomInt`. При коллизии (`bookings_reference_key`) транзакция повторяется, до трёх раз.

```ts
import { randomInt } from 'node:crypto';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const newReference = () =>
  'SB-' + Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
```

### 10.5 Отмена брони

```sql
UPDATE bookings
   SET status = 'cancelled', cancelled_at = now()
 WHERE id = $1
   AND guest_id = $2
   AND status = 'confirmed'
   AND check_in > $3::date          -- $3 = сегодня в APP_TIMEZONE
RETURNING *;
```

Одно условие проверяет сразу владельца, статус и «до даты заезда». Если обновлено 0 строк, сервис выясняет причину: чужая или несуществующая бронь → `NOT_FOUND`; уже отменена → `BOOKING_ALREADY_CANCELLED`; заезд наступил → `BOOKING_ALREADY_STARTED`. Повторное нажатие безопасно: второй запрос обновит 0 строк.

Бронь не удаляется, а `EXCLUDE` не учитывает `cancelled`, поэтому номер сразу снова доступен (FR-5.4, BR-5).

### 10.6 Отзыв о завершённом проживании

```sql
INSERT INTO reviews (booking_id, rating, comment)
SELECT b.id, $3, $4
  FROM bookings b
 WHERE b.id = $1
   AND b.guest_id = $2
   AND b.status = 'confirmed'
   AND b.check_out < $5::date       -- $5 = сегодня: выезд уже в прошлом
RETURNING *;
```

0 строк → бронь не найдена (`NOT_FOUND`) либо отзыв недопустим (`REVIEW_NOT_ALLOWED`: отменена или проживание не завершено). Повторный отзыв отклоняет `UNIQUE (booking_id)` → `REVIEW_DUPLICATE`.

### 10.7 Статусы брони

В базе два статуса, остальное вычисляется по датам.

```mermaid
stateDiagram-v2
    [*] --> confirmed : бронь подтверждена
    confirmed --> cancelled : отмена гостем до даты заезда
    cancelled --> [*]
```

| Что видит гость | Условие (`today` — сегодня в APP_TIMEZONE) |
| --- | --- |
| Предстоящая | `status = 'confirmed'` и `check_in > today` |
| Текущая | `status = 'confirmed'` и `check_in <= today <= check_out` |
| Прошедшая | `status = 'confirmed'` и `check_out < today` |
| Отменённая | `status = 'cancelled'` |

```sql
CASE
  WHEN b.status = 'cancelled' THEN 'cancelled'
  WHEN b.check_in  > $today   THEN 'upcoming'
  WHEN b.check_out >= $today  THEN 'current'
  ELSE 'past'
END AS phase
```

### 10.8 Изменения менеджера и существующие брони

Принцип: менеджер не может «тихо» сломать подтверждённую бронь (FR-7.5).

| Действие | Правило |
| --- | --- |
| Править описание, адрес, удобства отеля | Всегда разрешено |
| Изменить цену номера | Разрешено; действует только на новые брони, старые хранят снимок |
| Изменить вместимость | Нельзя ниже, чем у любой будущей подтверждённой брони номера → `ROOM_HAS_BOOKINGS` |
| Выключить номер (`is_active = false`) | Только если нет подтверждённых броней с выездом позже сегодняшнего дня → иначе `ROOM_HAS_BOOKINGS` |
| Закрыть номер на период | Только если период не пересекается с подтверждённой бронью → иначе `ROOM_HAS_BOOKINGS` (с перечнем конфликтующих броней) |
| Закрыть там, где уже есть закрытие | `CLOSURE_OVERLAP` (срабатывает `EXCLUDE`) |
| Удалить номер или отель | Не поддерживается: только `is_active` / `is_published` |

Все изменения номера выполняются в транзакции, которая сначала берёт строку номера `FOR UPDATE` (раздел 14.3).

### 10.9 Закрытие номера на период

1. Проверить, что менеджер назначен на отель номера (раздел 4.3).
2. Начать транзакцию, взять `rooms … FOR UPDATE`.
3. Проверить `from < to`, период не в прошлом.
4. Найти подтверждённые брони с пересекающимися ночами; если есть — `ROOM_HAS_BOOKINGS`.
5. `INSERT` в `room_closures`; пересечение с другим закрытием → `CLOSURE_OVERLAP`.

### 10.10 Фильтры и сортировка (необязательные возможности)

| Возможность | Реализация |
| --- | --- |
| Сортировка по цене или рейтингу | Параметр `sort` в `GET /api/hotels` |
| Фильтр по удобствам | Условие `h.amenities @> $5::text[]` |
| Фильтры в списке броней менеджера | Параметры `status`, `roomId`, `checkInFrom`, `checkInTo`, `q` |

---

## 11. Алгоритм доступности номеров

### 11.1 Ночи и полуоткрытый интервал

Проживание хранится как `[check_in, check_out)`: ночи от дня заезда до дня, **предшествующего** выезду.

```
Дни:            1 июня     2    3    4    5 июня     6    7    8 июня
Бронь A:        [──────────────────────────)                          заезд 1, выезд 5
Бронь B:                                    [─────────────────────)   заезд 5, выезд 8   ✅ стык
Бронь C:                              [───────────────)               заезд 4, выезд 7   ❌ пересекается
```

### 11.2 Правило пересечения

Два периода пересекаются, если каждый начинается раньше, чем заканчивается другой:

```
A.заезд < B.выезд   И   B.заезд < A.выезд
```

В PostgreSQL то же делает оператор `&&`: `daterange(a_in, a_out, '[)') && daterange(b_in, b_out, '[)')`.

Пример из ТЗ (BR-1): у номера 101 есть подтверждённая бронь 1–5 июня.

| Запрашиваемый период | Вычисление | Результат |
| --- | --- | --- |
| 5–8 июня | 1 < 8 ✔, 5 < 5 ✘ | Свободно |
| 4–7 июня | 1 < 7 ✔, 4 < 5 ✔ | Занято |
| 2–3 июня | 1 < 3 ✔, 2 < 5 ✔ | Занято |
| 5–6 июня | 1 < 6 ✔, 5 < 5 ✘ | Свободно |

Если проверять только дату заезда, запрос 4–7 июня при существующей брони 5–8 июня «прошёл» бы: 4 июня свободно, хотя ночи 5 и 6 заняты. Поэтому проверяется весь интервал.

### 11.3 Функция проверки в коде

```ts
// lib/dates.ts — то же правило для юнит-тестов и ранней проверки на клиенте
export const overlaps = (aIn: string, aOut: string, bIn: string, bOut: string) =>
  aIn < bOut && bIn < aOut;          // даты в формате YYYY-MM-DD сравниваются как строки
```

Окончательное решение всегда принимает база: код нужен для тестов и быстрых подсказок в интерфейсе.

### 11.4 Алгоритм проверки одного номера

```mermaid
flowchart TD
    A["Запрос: номер, заезд, выезд, гости"] --> B{"Даты корректны?<br/>заезд не в прошлом, выезд позже заезда,<br/>не более 30 ночей"}
    B -- нет --> E1["400 DATES_INVALID"]
    B -- да --> C{"Номер активен<br/>и вмещает гостей?"}
    C -- нет --> E2["Номер не подходит"]
    C -- да --> D{"Есть confirmed-бронь<br/>с пересечением?"}
    D -- да --> N1["Недоступен: BOOKED"]
    D -- нет --> F{"Есть закрытие<br/>с пересечением?"}
    F -- да --> N2["Недоступен: CLOSED"]
    F -- нет --> Y["Доступен"]
```

**Список свободных подходящих номеров отеля** (`$1` — отель, `$2` — заезд, `$3` — выезд, `$4` — гостей):

```sql
SELECT r.id, r.number, r.room_type, r.capacity, r.description, r.price_per_night
FROM rooms r
WHERE r.hotel_id = $1
  AND r.is_active
  AND r.capacity >= $4
  AND NOT EXISTS (
        SELECT 1 FROM bookings b
         WHERE b.room_id = r.id
           AND b.status = 'confirmed'
           AND b.stay && daterange($2::date, $3::date, '[)'))
  AND NOT EXISTS (
        SELECT 1 FROM room_closures c
         WHERE c.room_id = r.id
           AND c.period && daterange($2::date, $3::date, '[)'))
ORDER BY r.price_per_night, r.number;
```

**Поиск отелей** (`$1` — город, `$2` — заезд, `$3` — выезд, `$4` — гостей):

```sql
WITH free_rooms AS (
  SELECT r.hotel_id, r.price_per_night
  FROM rooms r
  WHERE r.is_active
    AND r.capacity >= $4
    AND NOT EXISTS (SELECT 1 FROM bookings b
                     WHERE b.room_id = r.id AND b.status = 'confirmed'
                       AND b.stay && daterange($2::date, $3::date, '[)'))
    AND NOT EXISTS (SELECT 1 FROM room_closures c
                     WHERE c.room_id = r.id
                       AND c.period && daterange($2::date, $3::date, '[)'))
)
SELECT h.id, h.name, h.city, h.short_description,
       MIN(f.price_per_night) AS from_price,
       rt.avg_rating, rt.reviews_count
FROM hotels h
JOIN free_rooms f ON f.hotel_id = h.id
LEFT JOIN LATERAL (
       SELECT round(avg(v.rating), 1) AS avg_rating, count(*) AS reviews_count
         FROM reviews v
         JOIN bookings b ON b.id = v.booking_id
         JOIN rooms    r ON r.id = b.room_id
        WHERE r.hotel_id = h.id) rt ON true
WHERE h.is_published AND lower(h.city) = lower($1)
GROUP BY h.id, rt.avg_rating, rt.reviews_count
ORDER BY from_price, h.name;
```

Отель попадает в выдачу только через `JOIN free_rooms`: нет подходящего свободного номера — нет и строки (BR-6).

### 11.5 Почему закрытия лежат в отдельной таблице

Закрытие на ремонт — решение менеджера, а не бронь гостя. Отдельная таблица не засоряет историю броней и отзывы, позволяет снять закрытие, не трогая брони, и упрощает правило «нельзя закрыть то, на что уже есть брони». Цена — две проверки вместо одной; их согласованность обеспечивает блокировка строки номера (раздел 14.3).

### 11.6 Сценарии из ТЗ

| Сценарий | Бронь в базе | Запрос | Результат |
| --- | --- | --- | --- |
| Стык | 101: 1–5 июня | 101: 5–8 июня | ✅ создаётся |
| Пересечение | 101: 1–5 июня | 101: 4–7 июня | ❌ `ROOM_NOT_AVAILABLE` |
| Вложенный период | 101: 1–5 июня | 101: 2–3 июня | ❌ `ROOM_NOT_AVAILABLE` |
| Другой номер | 101: 1–5 июня | 102: 1–5 июня | ✅ создаётся |
| После отмены | 101: 1–5 июня отменена | 101: 1–5 июня | ✅ создаётся |
| Закрыт на ремонт | 101 закрыт 20–22 декабря | 101: 21–23 декабря | ❌ `ROOM_NOT_AVAILABLE` |

---

## 12. Аутентификация и безопасность

### 12.1 Регистрация

1. zod проверяет поля (раздел 9.3).
2. Email приводится к нижнему регистру.
3. Пароль хэшируется bcrypt (cost 12).
4. `INSERT INTO users`; нарушение `users_email_key` → `EMAIL_IN_USE`.
5. Создаётся JWT, ставится cookie, возвращается профиль.

Допускаются только роли `guest` и `manager`; других ролей через сайт создать нельзя.

### 12.2 Вход

1. Найти пользователя по email.
2. Сравнить пароль с хэшем (`bcrypt.compare`). Если пользователя нет, всё равно выполнить сравнение с «пустым» хэшем, чтобы время ответа не выдавало существование email.
3. Любая ошибка → одинаковая `BAD_CREDENTIALS`.
4. Успех → JWT и cookie.

### 12.3 JWT и cookie

| Параметр | Значение |
| --- | --- |
| Содержимое токена | `{ sub: userId, role }` |
| Подпись | `JWT_SECRET` (не короче 32 символов) |
| Срок жизни | 7 дней |
| Cookie | `httpOnly`, `sameSite=lax`, `secure` в продакшене |

Идентификатор пользователя всегда берётся из токена, а не из тела запроса.

### 12.4 Угрозы и защита

| Угроза | Защита |
| --- | --- |
| Чужие брони и отели | Условие владельца в каждом SQL, ответ `404` |
| Подмена цены | Итог всегда считается на сервере; `expectedTotal` нужен только для сверки |
| Подмена пользователя | Идентификатор из токена |
| SQL-инъекция | Только параметризованные запросы |
| XSS | React экранирует текст; отзывы и описания выводятся как текст, не как HTML; helmet с CSP |
| CSRF | `sameSite=lax` + проверка заголовка `Origin` на изменяющих запросах |
| Подбор пароля | 10 попыток входа за 15 минут с одного IP (`express-rate-limit`) |
| Утечка внутренностей | Наружу только `code` и `message`, стек — в логи |
| Секреты в публичном репозитории | `.env` в `.gitignore`; в репозитории только `.env.example` |

---

## 13. Обработка ошибок

### 13.1 Как устроено

Бизнес-ошибки сервис выбрасывает как `AppError(code, details?)`. В Express 5 исключения из `async`-обработчиков попадают в общий обработчик ошибок сами, дополнительных обёрток не нужно.

```ts
export class AppError extends Error {
  constructor(public code: ErrorCode, public details?: Record<string, unknown>) { super(code); }
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError)  return send(res, 'VALIDATION_FAILED', { fields: flatten(err) });
  if (err instanceof AppError)  return send(res, err.code, err.details);
  if (isPgError(err, '23505'))  return send(res, mapUnique(err.constraint));   // email, номер комнаты, отзыв
  if (isPgError(err, '23P01'))  return send(res, mapExclusion(err.constraint)); // бронь или закрытие
  req.log.error({ err }, 'unhandled');
  return send(res, 'INTERNAL');
};
```

### 13.2 Коды ошибок

| HTTP | Код | Сообщение пользователю |
| --- | --- | --- |
| 400 | VALIDATION_FAILED | Проверьте введённые данные |
| 400 | DATES_INVALID | Проверьте даты: заезд не раньше сегодня, выезд позже заезда, не более 30 ночей |
| 400 | GUESTS_OVER_CAPACITY | В этом номере может разместиться не более N гостей |
| 401 | UNAUTHORIZED | Войдите в аккаунт, чтобы продолжить |
| 401 | BAD_CREDENTIALS | Неверный email или пароль |
| 403 | FORBIDDEN | У вас нет доступа к этому разделу |
| 404 | NOT_FOUND | Не найдено |
| 409 | EMAIL_IN_USE | Этот email уже зарегистрирован |
| 409 | ROOM_NOT_AVAILABLE | Этот номер уже занят на выбранные даты |
| 409 | QUOTE_CHANGED | Цена изменилась. Проверьте новый итог и подтвердите ещё раз |
| 409 | BOOKING_ALREADY_CANCELLED | Бронирование уже отменено |
| 409 | BOOKING_ALREADY_STARTED | Заезд уже наступил, отменить бронирование нельзя |
| 409 | REVIEW_NOT_ALLOWED | Отзыв можно оставить только после завершённого проживания |
| 409 | REVIEW_DUPLICATE | Вы уже оставили отзыв на это бронирование |
| 409 | ROOM_NUMBER_TAKEN | Номер с таким обозначением уже есть в отеле |
| 409 | ROOM_HAS_BOOKINGS | На этот номер есть будущие бронирования — изменение невозможно |
| 409 | CLOSURE_OVERLAP | На эти даты номер уже закрыт |
| 429 | RATE_LIMITED | Слишком много попыток. Подождите несколько минут |
| 500 | INTERNAL | Что-то пошло не так. Попробуйте ещё раз |

### 13.3 Что видит пользователь

| Ситуация | Реакция интерфейса |
| --- | --- |
| Ошибка валидации | Подсказка под нужным полем (из `fields`) |
| `ROOM_NOT_AVAILABLE` | Сообщение и автоматически обновлённый список номеров |
| `QUOTE_CHANGED` | Новый итог и кнопка «Подтвердить с новой ценой» |
| `UNAUTHORIZED` | Переход на вход, затем возврат на ту же страницу |
| `FORBIDDEN` | Страница «Нет доступа» |
| `INTERNAL` | Общее сообщение, кнопка «Повторить» |

---

## 14. Конкурентное бронирование

### 14.1 Проблема

Два гостя одновременно бронируют номер 101 на пересекающиеся ночи. Если сначала проверять «свободно ли?», а потом вставлять:

```
Гость A: проверка → свободно
Гость B: проверка → свободно
Гость A: INSERT
Гость B: INSERT        →  две брони на один номер ❌
```

### 14.2 Решение: `EXCLUDE` в базе

Ограничение `bookings_no_overlap` (раздел 8.7) не даёт сохранить вторую подтверждённую бронь с пересекающимися ночами. Вторая транзакция дожидается первой; после её `COMMIT` получает ошибку `23P01`, откатывается, и гость видит `ROOM_NOT_AVAILABLE`.

| Подход | Вывод |
| --- | --- |
| Проверка в коде перед `INSERT` | Не защищает от гонки |
| Уровень `SERIALIZABLE` | Надёжно, но нужны повторы транзакций |
| Блокировка всех броней номера | Работает, но легко ошибиться |
| **`EXCLUDE` по `(room_id, stay)`** | Выбрано: правило живёт в данных, работает даже при ошибке в коде |

Уровень изоляции — стандартный `READ COMMITTED`: защиту даёт ограничение.

### 14.3 Закрытие номера против бронирования

`EXCLUDE` сравнивает брони только с бронями. Закрытие и бронь лежат в разных таблицах, поэтому согласованность обеспечивается **блокировкой строки номера**:

| Операция | Блокировка |
| --- | --- |
| Создание брони | `SELECT … FROM rooms WHERE id = $1 FOR SHARE` |
| Закрытие номера, деактивация, смена вместимости | `SELECT … FROM rooms WHERE id = $1 FOR UPDATE` |

`FOR SHARE` не мешает другим броням (их разводит `EXCLUDE`), но несовместима с `FOR UPDATE` менеджера: операции по одному номеру выстраиваются в очередь.

```mermaid
sequenceDiagram
    participant M as Менеджер
    participant G as Гость
    participant DB as PostgreSQL
    M->>DB: BEGIN, строка номера FOR UPDATE
    G->>DB: BEGIN, строка номера FOR SHARE
    Note over G,DB: гость ждёт, пока менеджер закончит
    M->>DB: проверка броней, INSERT закрытия, COMMIT
    DB-->>G: блокировка снята
    G->>DB: проверка закрытий находит новое закрытие
    G->>DB: ROLLBACK
    G-->>G: ответ 409 ROOM_NOT_AVAILABLE
```

### 14.4 Транзакции

Бронирование выполняется в одной транзакции (`withTransaction`): блокировка номера → проверки → `INSERT`. Любая ошибка откатывает всё. Транзакции короткие, внутри них нет обращений к внешним системам.

### 14.5 Другие случаи одновременности

| Ситуация | Что происходит |
| --- | --- |
| Гость дважды нажал «Подтвердить» | Кнопка блокируется; на сервере второй запрос получит `ROOM_NOT_AVAILABLE`, потому что номер уже занят его же бронью |
| Дважды нажали «Отменить» | `UPDATE … WHERE status = 'confirmed'` обновит 0 строк → `BOOKING_ALREADY_CANCELLED` |
| Менеджер изменил цену, пока гость смотрел расчёт | `expectedTotal` не совпадёт → `QUOTE_CHANGED` с новым итогом |
| Старый список номеров на экране | При `ROOM_NOT_AVAILABLE` клиент перезапрашивает список |

### 14.6 Как проверить

```ts
it('из 20 одновременных запросов подтверждается ровно один', async () => {
  const results = await Promise.all(guests.map((g) =>
    api.post('/api/bookings').set('Cookie', g.cookie)
       .send({ roomId, checkIn: '2026-12-01', checkOut: '2026-12-05', guests: 2 })));
  expect(results.filter((r) => r.status === 201)).toHaveLength(1);
  expect(results.filter((r) => r.status === 409)).toHaveLength(19);
});
```

---

## 15. Логирование

### 15.1 Что используется

`pino` пишет логи в формате JSON, `pino-http` добавляет запись о каждом запросе. Каждому запросу присваивается `requestId`, он попадает во все записи этого запроса.

### 15.2 Уровни

| Уровень | Когда |
| --- | --- |
| `error` | Необработанные исключения, сбои базы |
| `warn` | Подозрительное: частые неудачные входы, `RATE_LIMITED` |
| `info` | Запросы, вход, бронирование, отмена, действия менеджера |
| `debug` | Подробности для разработки (только локально) |

### 15.3 Что логировать и что нет

| Логируем | Не логируем |
| --- | --- |
| `requestId`, метод, адрес, код ответа, время | Пароли и хэши |
| Идентификатор пользователя, код бизнес-ошибки | Токены и cookie |
| Создание, отмена брони (id, номер брони) | Полные тексты отзывов |
| Изменения цены и закрытия номеров менеджером | Данные карт (их нет в системе) |

Настройка pino: `redact` скрывает `req.headers.cookie` и поля `password`.

### 15.4 Журнал действий менеджера

В версии 1.0 отдельной таблицы аудита нет: изменения менеджера фиксируются записями уровня `info` (кто, какой номер, что изменено, старая и новая цена). Если понадобится хранить историю в базе, добавляется таблица `audit_log (id, user_id, action, entity, entity_id, details jsonb, created_at)`.

---

## 16. Интеграции

### 16.1 Внешние системы

В версии 1.0 внешних интеграций нет (ТЗ исключает интеграции с системами отелей и реальные платежи). Единственная «внешняя» часть — хостинг базы данных и GitHub для кода и автоматических проверок.

### 16.2 Взаимодействие компонентов

| От | К | Как |
| --- | --- | --- |
| Браузер | Сервер | HTTPS, JSON, cookie с токеном |
| Сервер | PostgreSQL | Пул соединений `pg` |
| Сервер | Логи | Стандартный вывод в формате JSON |
| GitHub | Автоматические проверки | GitHub Actions при каждом push |

### 16.3 Связь фронта и бэка при разработке

| Режим | Как |
| --- | --- |
| Разработка | Vite на `localhost:5173` проксирует `/api` на `localhost:3000` (`server.proxy` в `vite.config.ts`); cookie работает, CORS не нужен |
| Продакшен | Express раздаёт `client/dist` и API с одного адреса |

### 16.4 Возможные интеграции в будущем

| Идея | Как встроится |
| --- | --- |
| Письма о подтверждении | Очередь писем в базе, отправка через SMTP после `COMMIT` |
| Реальные платежи | Платёжный провайдер, статус `pending` у брони и временное удержание номера |
| Фотографии отелей | Таблица `hotel_photos`, хранилище файлов |
| Календарь | Выгрузка брони в файл `.ics` |
| Синхронизация с системой отеля | Отдельный модуль с очередью заданий |

---

## 17. Frontend

### 17.1 Страницы

| Адрес | Экран | Кто | Что на нём |
| --- | --- | --- | --- |
| `/` | Поиск | Все | Город, даты, число гостей |
| `/hotels?city=&checkIn=&checkOut=&guests=` | Результаты | Все | Карточки отелей: название, город, описание, цена «от», рейтинг |
| `/hotels/:id?checkIn=&checkOut=&guests=` | Отель | Все | Описание, адрес, удобства, свободные номера, отзывы |
| `/checkout?roomId=&checkIn=&checkOut=&guests=` | Подтверждение | Гость | Ночи, цена за ночь, итог, кнопка «Подтвердить» |
| `/bookings` | Мои бронирования | Гость | Вкладки: предстоящие, текущие, прошедшие, отменённые |
| `/bookings/:id` | Бронирование | Владелец | Детали, «Отменить», «Оставить отзыв» |
| `/signin`, `/signup` | Вход, регистрация | Посетитель | Формы |
| `/profile` | Профиль | Вошедший | Имя, email, дата регистрации |
| `/manage` | Мои отели | Менеджер | Список и «Добавить отель» |
| `/manage/hotels/:id` | Отель | Менеджер | Данные отеля и список номеров |
| `/manage/rooms/:id` | Номер | Менеджер | Параметры, цена, закрытия на период |
| `/manage/hotels/:id/bookings` | Брони отеля | Менеджер | Таблица с фильтрами |
| `*` | 404 | Все | «Страница не найдена» |

Страница подтверждения открывается только после входа: незалогиненного гостя перенаправляют на `/signin` и затем возвращают обратно с теми же параметрами.

### 17.2 Путь гостя

```mermaid
flowchart LR
    S["Поиск"] --> R["Результаты"] --> H["Отель и номера"]
    H --> L{"Гость вошёл?"}
    L -- нет --> SI["Вход или регистрация"] --> C
    L -- да --> C["Подтверждение: ночи, цена, итог"]
    C --> P{"POST /api/bookings"}
    P -- "201" --> B["Бронирование с номером брони"]
    P -- "409 номер занят" --> H
    B --> MB["Мои бронирования"] --> X["Отмена или отзыв"]
```

### 17.3 Макеты главных экранов

**Подтверждение брони**

```
┌──────────────────────────────────────────────┐
│  Подтверждение бронирования                  │
│  Ала-Тоо · Бишкек · Номер 101 (Standard)     │
│                                              │
│  Заезд   1 июня 2026                         │
│  Выезд   5 июня 2026                         │
│  Гостей  2                                   │
│  ─────────────────────────────────────────   │
│  4 ночи × 3 500 сом                          │
│  Итого                         14 000 сом    │
│                                              │
│  [ Подтвердить бронирование ]                │
└──────────────────────────────────────────────┘
```

**Мои бронирования**

```
┌──────────────────────────────────────────────┐
│ [Предстоящие] Текущие  Прошедшие  Отменённые │
├──────────────────────────────────────────────┤
│ Ала-Тоо · №101        SB-K7M2QX  Предстоящая │
│ 1–5 июня · 4 ночи · 14 000 сом   [Отменить]  │
├──────────────────────────────────────────────┤
│ Ош Плаза · №204       SB-9PQ4TD  Предстоящая │
│ 12–14 июля · 2 ночи · 9 000 сом  [Отменить]  │
└──────────────────────────────────────────────┘
```

### 17.4 Компоненты

| Компонент | Назначение |
| --- | --- |
| `SearchForm` | Город, даты, гости; проверка «выезд позже заезда» |
| `HotelCard` | Карточка результата поиска |
| `RoomCard` | Номер: тип, вместимость, цена за ночь, итог за период, кнопка «Выбрать» |
| `PriceSummary` | Ночи × цена за ночь = итог (на подтверждении и в брони) |
| `BookingCard`, `BookingDetails` | Бронь кратко и полностью |
| `PhaseBadge` | «Предстоящая», «Текущая», «Прошедшая», «Отменена» |
| `ReviewForm`, `ReviewList` | Оценка 1–5 с текстом; список отзывов |
| `ConfirmDialog` | Подтверждение отмены |
| `ClosureForm` | Менеджер: период и причина закрытия номера |
| `RequireAuth`, `RequireManager` | Ограничение доступа к страницам |
| `FormField` | Поле с подписью и сообщением об ошибке (UX-3) |

### 17.5 Состояние

| Что | Где хранится |
| --- | --- |
| Кто вошёл | Контекст, наполняется запросом `GET /api/auth/profile` при загрузке |
| Данные с сервера | TanStack Query; после бронирования или отмены обновляются списки броней и номеров |
| Параметры поиска и даты | В адресе страницы: ссылкой можно поделиться, страница переживает обновление |
| Поля форм | React Hook Form + zod, ошибки сервера (`fields`) подставляются под поля |

### 17.6 Удобство и адаптивность

- Ширина от 360 px: карточки перестраиваются в одну колонку, таблицы менеджера прокручиваются по горизонтали.
- Элементы управления не меньше 44 px по высоте; у всех полей есть подписи, у кнопок — понятный текст.
- Пустые состояния: «На эти даты свободных номеров в этом городе нет. Попробуйте изменить даты».
- Кнопка «Отменить» скрыта, когда заезд наступил, вместо неё — поясняющий текст.
- При закрытии номера с бронями менеджер видит список конфликтующих броней.

---

## 18. Развёртывание

### 18.1 Окружения

| Окружение | Где | База |
| --- | --- | --- |
| Локальное | Компьютер разработчика | PostgreSQL локально или в Docker |
| Тестовое | GitHub Actions | Контейнер `postgres:16`, база `staybook_test` |
| Продакшен | Облачный хостинг | Управляемая PostgreSQL |

### 18.2 Переменные окружения (`.env`)

Файл `.env` создаётся из `.env.example` и **не попадает в репозиторий**.

```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/staybook
JWT_SECRET=длинная-случайная-строка-не-короче-32-символов
APP_TIMEZONE=Asia/Bishkek
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=debug
SEED_PASSWORD=пароль-для-тестовых-аккаунтов
```

### 18.3 База в Docker (по желанию)

```yaml
# docker-compose.yml (только база)
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: staybook
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]
volumes:
  pgdata:
```

### 18.4 Сборка для продакшена

```dockerfile
FROM node:24-alpine AS build
WORKDIR /app
COPY client ./client
COPY server ./server
RUN cd client && npm ci && npm run build
RUN cd server && npm ci && npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/server/dist ./dist
COPY --from=build /app/server/package*.json ./
COPY --from=build /app/server/migrations ./migrations
COPY --from=build /app/client/dist ./public
RUN npm ci --omit=dev
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### 18.5 Первый запуск по шагам (PowerShell)

```powershell
# 1. База данных (если PostgreSQL установлен локально)
psql -U postgres -c "CREATE DATABASE staybook;"

# 2. Сервер
cd server
npm install
copy .env.example .env      # затем заполнить значения
npm run db:migrate          # применить SQL-миграции
npm run db:seed             # тестовые данные
npm run dev                 # http://localhost:3000

# 3. Клиент (в другом окне терминала)
cd client
npm install
npm run dev                 # http://localhost:5173
```

Команды `db:migrate` и `db:seed` — обёртки над `node-pg-migrate up` и `scripts/seed.ts`.

### 18.6 Git и GitHub

| Что | Правило |
| --- | --- |
| Репозиторий | Публичный: в нём нельзя оставлять пароли, `JWT_SECRET`, строки подключения к рабочей базе |
| `.gitignore` | `node_modules/`, `dist/`, `.env`, `*.log` |
| Обновления | `git add .` → `git commit -m "что изменил"` → `git push` |

### 18.7 Автоматическая проверка (GitHub Actions)

```yaml
name: ci
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: staybook_test
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U postgres"
          --health-interval 5s --health-timeout 5s --health-retries 10
    env:
      DATABASE_URL: postgres://postgres:postgres@localhost:5432/staybook_test
      JWT_SECRET: test-secret-test-secret-test-secret-123
      APP_TIMEZONE: Asia/Bishkek
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: npm, cache-dependency-path: server/package-lock.json }
      - run: npm ci
        working-directory: server
      - run: npm run db:migrate
        working-directory: server
      - run: npm test
        working-directory: server
```

### 18.8 Продакшен и резервные копии

Один сервис (Express + собранный React) и управляемая PostgreSQL у облачного хостинга (например, Render или Railway). Миграции применяются при деплое командой `npm run db:migrate`, секреты задаются в настройках хостинга. `secure`-cookie требует HTTPS: хостинг выдаёт сертификат автоматически. Ежедневные резервные копии базы делает хостинг.

---

## 19. Тестирование

### 19.1 Уровни

| Уровень | Инструмент | Что проверяем |
| --- | --- | --- |
| Модульные | Vitest | Подсчёт ночей и итога, правило пересечения, номер брони, фаза брони, схемы zod |
| Интеграционные | Vitest + тестовая БД | Сервисы и SQL на настоящем PostgreSQL: бронь, отмена, отзыв, `EXCLUDE`, закрытия |
| API | Supertest | Коды ответов, форматы, права, ошибки |
| Сквозные | Playwright | Пользовательские сценарии в браузере |
| Ручные | Postman или REST-клиент в VS Code | Быстрая проверка эндпоинтов |

### 19.2 Примеры модульных тестов

```ts
it('стык не считается пересечением', () => {
  expect(overlaps('2026-06-01', '2026-06-05', '2026-06-05', '2026-06-08')).toBe(false);
});
it('пересечение', () => {
  expect(overlaps('2026-06-01', '2026-06-05', '2026-06-04', '2026-06-07')).toBe(true);
});
it('итог = ночи × цена', () => {
  expect(nightsBetween('2026-06-01', '2026-06-05') * 3500).toBe(14000);
});
```

### 19.3 Приёмочные сценарии ТЗ

| Сценарий | Проверка | Ожидание | Уровень |
| --- | --- | --- | --- |
| A1 Поиск | Город + даты + гости | Только отели с подходящим свободным номером на весь период | API |
| A2 Смежные брони | 101: 1–5 июня, затем 5–8 июня | Обе брони `201` | Интеграционный |
| A3 Пересечение | 101: 1–5 июня, затем 4–8 июня | `409 ROOM_NOT_AVAILABLE` | Интеграционный |
| A4 Разные номера | 101 и 102 на одни даты | Обе брони `201` | Интеграционный |
| A5 Вместимость | Номер на 2 гостя, запрос на 3 | `400 GUESTS_OVER_CAPACITY` | API |
| A6 Неизменность цены | Бронь, затем менеджер меняет цену | Итог брони прежний, новая бронь — по новой цене | Интеграционный |
| A7 Отмена | Отмена будущей брони, затем новая бронь на те же ночи | Бронь в истории со статусом `cancelled`, новая `201` | Интеграционный |
| A8 Одновременные запросы | 20 параллельных запросов на одни ночи | Один `201`, девятнадцать `409` | Интеграционный |
| A9 Отзывы | Отзыв о прошедшей, будущей и отменённой брони | `201`, `REVIEW_NOT_ALLOWED`, `REVIEW_NOT_ALLOWED` | API |
| A10 Доступ | Гость вызывает `/api/manage/*`; менеджер правит чужой отель | `403`, `404` | API |

### 19.4 Дополнительные проверки правил

| Проверка | Ожидание |
| --- | --- |
| Заезд вчера | `DATES_INVALID` (BR-2) |
| Выезд равен заезду | `DATES_INVALID` (BR-2) |
| Период 5–6 июня при брони 1–5 июня | Свободно (день выезда не занят) |
| Отмена в день заезда | `BOOKING_ALREADY_STARTED` |
| Повторная отмена | `BOOKING_ALREADY_CANCELLED` |
| Второй отзыв на ту же бронь | `REVIEW_DUPLICATE` |
| Деактивация номера с будущей бронью | `ROOM_HAS_BOOKINGS` |
| Закрытие номера на период с бронью | `ROOM_HAS_BOOKINGS` |
| Закрытие поверх существующего закрытия | `CLOSURE_OVERLAP` |
| Бронь с устаревшим `expectedTotal` | `QUOTE_CHANGED` |

### 19.5 Сквозные сценарии (Playwright)

1. Гость ищет отель → открывает номер → входит → подтверждает бронь → видит номер `SB-…`.
2. Гость отменяет предстоящую бронь → она в «Отменённых», номер снова доступен в поиске.
3. Менеджер закрывает номер на период → номер пропадает из выдачи на эти даты.
4. Два браузера одновременно бронируют один номер → у одного успех, у другого понятное сообщение.

### 19.6 Тестовая база

Отдельная база `staybook_test`. Перед набором тестов: миграции → очистка таблиц → seed. Цель покрытия — не менее 80 % для сервисов.

---

## 20. Нефункциональные требования

### 20.1 Производительность

| Показатель | Цель |
| --- | --- |
| Поиск отелей и список номеров | Быстрее 1 с при 1 000 отелей, 20 000 номеров и 200 000 броней |
| Остальные запросы | Быстрее 300 мс |
| Основа | Индексы из раздела 8.6, пул соединений |

### 20.2 Надёжность

- Двойная бронь невозможна ни при каких условиях (`EXCLUDE`).
- Операции из нескольких шагов выполняются в транзакции.
- Ошибка одного запроса не останавливает сервер.

### 20.3 Масштабируемость

Сервер не хранит состояние в памяти (токен в cookie, данные в базе), поэтому его можно запустить в нескольких экземплярах за балансировщиком. Узкое место — база; при росте читающие запросы выносятся на реплику.

### 20.4 Безопасность

Требования раздела 12; секреты только в переменных окружения.

### 20.5 Удобство использования

Путь «поиск → подтверждённая бронь» — не более 4 экранов; ошибки на понятном языке; формы показывают подсказки у полей.

### 20.6 Совместимость

Актуальные Chrome, Firefox, Safari, Edge; ширина экрана от 360 px.

### 20.7 Поддерживаемость

TypeScript, ESLint, Prettier, README с инструкцией запуска, тесты в CI, миграции вместо ручных правок схемы. В логи не попадают пароли, хэши и токены.

---

## 21. Ограничения и риски

### 21.1 Ограничения версии 1.0

| Ограничение | Причина |
| --- | --- |
| Одна бронь — один номер | ТЗ |
| Нет реальных платежей и возвратов | ТЗ |
| Единая валюта и часовой пояс | Допущения A5, A6 |
| Менеджер не может отменить бронь гостя | В ТЗ не описано (A10) |
| Нет временного удержания номера на время оформления | Номер резервируется только при подтверждении; при конфликте гость получает сообщение |
| Роль менеджера выбирается при регистрации | Учебное упрощение (A1) |

### 21.2 Риски

| Риск | Что делаем |
| --- | --- |
| Двойная бронь из-за ошибки в коде | `EXCLUDE` в базе + тест на 20 параллельных запросов |
| Расхождение «закрытие / бронь» при одновременных действиях | Блокировка строки номера (раздел 14.3) + тест |
| Ошибки с датами и часовыми поясами около полуночи | Единый `APP_TIMEZONE`, «сегодня» считается в одном месте, тесты на граничные даты |
| Прошедшие брони нельзя создать через API | Seed вставляет их SQL-ом |
| Утечка секретов в публичный репозиторий | `.env` в `.gitignore`, проверка перед первым push |
| Не хватит времени | Сначала сквозной путь (поиск → бронь → отмена), затем отзывы и кабинет менеджера, затем необязательное |

---

## 22. Приложения

### 22.1 Словарь терминов

| Термин | Значение |
| --- | --- |
| Ночь | Календарная дата, на которую номер занят; день выезда ночью не считается |
| `daterange` | Тип PostgreSQL для диапазона дат |
| Полуоткрытый интервал `[a, b)` | От `a` включительно до `b` не включая |
| `EXCLUDE` | Ограничение PostgreSQL: запрещает строки, «конфликтующие» друг с другом |
| Закрытие номера | Период, когда менеджер временно закрыл номер (ремонт) |
| Расчёт (quote) | Предварительный подсчёт ночей и итога без создания брони |
| Снимок цены | Цена за ночь, записанная в бронь в момент подтверждения |
| Фаза брони | Предстоящая, текущая, прошедшая или отменённая; вычисляется по статусу и датам |
| Транзакция | Группа операций с базой, которая выполняется целиком или откатывается |
| JWT | Подписанный токен, по которому сервер узнаёт пользователя |

### 22.2 Схемы в документе

| Схема | Раздел |
| --- | --- |
| Система на одной схеме | 2.4 |
| Сквозной сценарий | 2.5 |
| Общая архитектура | 5.2 |
| Путь запроса бронирования | 5.3 |
| ER-диаграмма | 8.2 |
| Статусы брони | 10.7 |
| Алгоритм проверки номера | 11.4 |
| Закрытие номера против бронирования | 14.3 |
| Путь гостя | 17.2 |

### 22.3 Начальные данные (seed)

| Что | Значение |
| --- | --- |
| Менеджеры | `manager@staybook.test` (отель «Ала-Тоо»), `manager2@staybook.test` (отель «Ош Плаза») |
| Гости | `guest@staybook.test`, `guest2@staybook.test` |
| Пароль | Из переменной `SEED_PASSWORD` в `.env` |
| Отели | «Ала-Тоо» (Бишкек), «Иссык-Куль Резорт» (Чолпон-Ата), «Ош Плаза» (Ош) |
| Номера «Ала-Тоо» | 101 Standard (2 гостя, 3500), 102 Standard (2 гостя, 3500), 201 Suite (4 гостя, 7200) |
| Брони | Относительно текущей даты: одна прошедшая (для отзыва), одна текущая, две предстоящие, одна отменённая |

Прошедшие брони создаются прямым SQL в seed: через API их создать нельзя (BR-2).

### 22.4 Сценарий финальной демонстрации (раздел 7 ТЗ)

| Шаг | Действие | Что показать |
| --- | --- | --- |
| 1 | Поиск «Бишкек», даты через неделю, 2 гостя | Отели со свободными номерами |
| 2 | Открыть «Ала-Тоо», выбрать номер 101 | Экран подтверждения: ночи × цена = итог |
| 3 | Подтвердить | Бронь с номером `SB-…` и статусом «подтверждено» |
| 4 | Забронировать 101 с заездом в день выезда первой брони | Смежная бронь проходит |
| 5 | Забронировать 101 на пересекающиеся даты | Отказ «номер занят» |
| 6 | Попытка брони с заездом вчера | Отказ с понятным сообщением |
| 7 | Отменить будущую бронь | Бронь остаётся в «Отменённых», номер снова доступен |
| 8 | Открыть прошедшую бронь и оставить отзыв | Отзыв и рейтинг на странице отеля |
| 9 | Войти менеджером «Ала-Тоо», изменить цену номера и описание | Новая бронь по новой цене, старая — по прежней |
| 10 | Закрыть номер на ремонт | Номер пропадает из выдачи на эти даты |
| 11 | Менеджер второго отеля пытается открыть «Ала-Тоо» | Отказ (A10) |

### 22.5 Необязательные возможности из ТЗ

| Возможность | Как встроится |
| --- | --- |
| Сортировка по цене или рейтингу | Уже предусмотрена параметром `sort` |
| Фильтры по удобствам | Условие по массиву `hotels.amenities` (оператор `@>`) |
| Избранные отели | Таблица `favorites (user_id, hotel_id)` и два эндпоинта |
| Фотографии отелей | Таблица `hotel_photos` и хранилище файлов |
| Письма о подтверждении | Очередь писем и отправка через SMTP после `COMMIT` |
| Бронирование нескольких номеров | Таблица `booking_groups`, объединяющая несколько броней |

### 22.6 План работ

| Этап | Результат |
| --- | --- |
| 1. Основа | Репозиторий, структура папок, подключение к БД, миграции, seed |
| 2. Учётные записи | Регистрация, вход, выход, профиль, проверка ролей |
| 3. Каталог | Поиск отелей, страница отеля, номера на даты, расчёт цены |
| 4. Бронирование | Создание брони, `EXCLUDE`, тест на одновременные запросы |
| 5. Мои бронирования | Список по фазам, детали, отмена |
| 6. Отзывы | Создание отзыва, рейтинг и отзывы на странице отеля |
| 7. Кабинет менеджера | Отели, номера, цены, закрытия, брони отеля, защита от изменений с будущими бронями |
| 8. Завершение | Сквозные тесты, CI, README, подготовка демонстрации |
