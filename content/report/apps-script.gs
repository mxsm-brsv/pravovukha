/**
 * Приём сообщений о неточностях из приложения «С правовухой на ты».
 * Каждое сообщение — новая строка в листе «Неточности» этой таблицы
 * и (если указана почта) письмо вам. Бот и токен не нужны.
 *
 * Как подключить — в content/report/README.md.
 */

// Почта, на которую присылать уведомления. Оставьте пустой, если письма не нужны.
const NOTIFY_EMAIL = '';

const SHEET_NAME = 'Неточности';
const HEADER = ['Когда', '№ вопроса', 'Что не так', 'Комментарий', 'Вопрос', 'Ответ в приложении', 'Где', 'Версия', 'Статус'];
const KINDS = {
  answer: 'Неверный ответ',
  wording: 'Неточная формулировка',
  outdated: 'Устаревшая норма',
  other: 'Другое',
};

function sheet_() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADER);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADER.length).setFontWeight('bold');
    const statuses = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Новая', 'В работе', 'Исправлено', 'Отклонено'], true)
      .build();
    sheet.getRange('I2:I').setDataValidation(statuses);
  }
  return sheet;
}

function clip_(value, max) {
  return String(value || '').slice(0, max);
}

function doPost(e) {
  const p = (e && e.parameter) || {};
  const row = [
    new Date(),
    clip_(p.id, 40),
    KINDS[p.kind] || clip_(p.kind, 40),
    clip_(p.comment, 1000),
    clip_(p.question, 1000),
    clip_(p.answer, 500),
    clip_(p.mode, 40),
    clip_(p.version, 20),
    'Новая',
  ];
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    sheet_().appendRow(row);
  } finally {
    lock.releaseLock();
  }

  if (NOTIFY_EMAIL) {
    MailApp.sendEmail(
      NOTIFY_EMAIL,
      'Правовуха: неточность в вопросе № ' + row[1],
      [row[2], 'Вопрос: ' + row[4], 'Ответ: ' + row[5], row[3] ? 'Комментарий: ' + row[3] : '', '', SpreadsheetApp.getActiveSpreadsheet().getUrl()]
        .filter(String)
        .join('\n'),
    );
  }
  return ContentService.createTextOutput('ok');
}

// Открыв адрес веб-приложения в браузере, можно проверить, что оно работает.
function doGet() {
  return ContentService.createTextOutput('Приём сообщений работает');
}
