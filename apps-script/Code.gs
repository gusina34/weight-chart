/**
 * Google Apps Script для Mini App «Прогресс веса».
 *
 * Отдаёт замеры ТОЛЬКО того пользователя, который открыл Mini App.
 * Telegram подписывает initData токеном бота, скрипт проверяет подпись,
 * поэтому чужие данные получить по ссылке нельзя.
 *
 * Настройка:
 * 1. Расширения → Apps Script в Google Таблице с замерами, вставить этот код.
 * 2. Настройки проекта → Свойства скрипта → добавить BOT_TOKEN = токен бота из @BotFather.
 * 3. Развернуть → Управление развёртываниями → новая версия (доступ: «Все»).
 *
 * Ожидаемые столбцы на листе (первая строка — заголовки): telegram_id | date | weight
 */

const SHEET_NAME = ''; // пусто = первый лист
const MAX_AGE_SECONDS = 24 * 60 * 60; // initData старше суток не принимаем

function doGet(e) {
  const user = verifyInitData_(e.parameter.initData || '');
  if (!user) return json_({ error: 'unauthorized' });

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];
  const values = sheet.getDataRange().getValues();
  const headers = values.shift().map(h => String(h).trim());

  const rows = values
    .map(r => Object.fromEntries(headers.map((h, i) => [h, r[i]])))
    .filter(r => String(r.telegram_id) === String(user.id))
    .map(r => ({
      telegram_id: String(r.telegram_id),
      date: r.date instanceof Date ? r.date.toISOString() : r.date,
      weight: r.weight
    }));

  return json_(rows);
}

// Проверка подписи: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
function verifyInitData_(initData) {
  const token = PropertiesService.getScriptProperties().getProperty('BOT_TOKEN');
  if (!token || !initData) return null;

  const params = {};
  initData.split('&').forEach(pair => {
    const i = pair.indexOf('=');
    params[decode_(pair.slice(0, i))] = decode_(pair.slice(i + 1));
  });

  const hash = params.hash;
  delete params.hash;
  const checkString = Object.keys(params).sort().map(k => k + '=' + params[k]).join('\n');

  const secret = Utilities.computeHmacSignature(
    Utilities.MacAlgorithm.HMAC_SHA_256, toBytes_(token), toBytes_('WebAppData'));
  const signature = Utilities.computeHmacSignature(
    Utilities.MacAlgorithm.HMAC_SHA_256, toBytes_(checkString), secret);
  const hex = signature.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');

  if (hex !== hash) return null;
  if (Date.now() / 1000 - Number(params.auth_date) > MAX_AGE_SECONDS) return null;
  return JSON.parse(params.user);
}

function decode_(s) {
  return decodeURIComponent(s.replace(/\+/g, ' '));
}

function toBytes_(s) {
  return Utilities.newBlob(s).getBytes();
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
