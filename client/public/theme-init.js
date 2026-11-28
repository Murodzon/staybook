// Ставит тему до отрисовки страницы, чтобы не было «вспышки» светлого фона.
// Отдельный файл, а не inline-скрипт: так его не заблокирует CSP от helmet.
(function () {
  var saved = null;
  try {
    saved = localStorage.getItem('staybook.theme');
  } catch (e) {}
  var dark = saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', dark);
})();
