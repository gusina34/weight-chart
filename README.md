# weight-chart

Telegram Mini App с графиком веса для бота [@Nina_fitbody_bot](https://t.me/Nina_fitbody_bot).
Опубликован через GitHub Pages: https://gusina34.github.io/weight-chart/

## Как работает

1. Бот (Leadteh) записывает замеры в Google Таблицу: столбцы `telegram_id`, `date`, `weight`.
2. Кнопка в боте открывает эту страницу как Web App.
3. Страница отправляет подписанные Telegram данные (`initData`) в Google Apps Script,
   скрипт проверяет подпись и возвращает замеры только этого пользователя.

## Настройка Google Apps Script

Код лежит в [`apps-script/Code.gs`](apps-script/Code.gs). Инструкция в начале файла.
После развёртывания вставьте ссылку `/exec` в `GOOGLE_SCRIPT_URL` в `index.html`.

## Кнопка в Leadteh

Кнопка должна быть типа **Web App** (не обычная ссылка), иначе Telegram не передаст данные пользователя
и страница покажет «Открой эту страницу через кнопку в боте».
