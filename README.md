# StayBook

Платформа бронирования номеров в отелях. Дизайн: [Technical_Design.md](Technical_Design.md).

## Запуск (PowerShell)

Нужны Node.js 24+ и Docker.

```powershell
docker compose up -d --wait
cd server
npm install
copy .env.example .env   # задать свой JWT_SECRET
npm run dev
```

Проверка: http://localhost:3000/api/health

## Фронтенд

В другом окне терминала, из папки проекта:

```powershell
cd client
npm install
npm run dev
```

Сайт: http://localhost:5180. План разработки: [PLAN.md](PLAN.md).

## Проверки

```powershell
npm run typecheck
npm test
```

## Этапы (раздел 22.6)

- [ ] 1. Основа: структура и подключение к БД (готово), миграции, seed
- [ ] 2. Учётные записи
- [ ] 3. Каталог
- [ ] 4. Бронирование
- [ ] 5. Мои бронирования
- [ ] 6. Отзывы
- [ ] 7. Кабинет менеджера
- [ ] 8. Завершение
