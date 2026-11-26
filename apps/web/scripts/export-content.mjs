// Собирает данные для приложения из папки content/:
//   content/Банк_вопросов.xlsx  → public/data/questions.json
//   content/decks.json          → public/data/decks.json (с числом вопросов)
//   content/puzzles/*.json      → public/data/puzzles.json
// Запускается перед каждой сборкой (pnpm build), поэтому правки в таблице
// попадают в приложение после обычного Commit → Push.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, "../../..");
const CONTENT = join(ROOT, "content");
const OUT = resolve(here, "../public/data");

const FORMATS = { "Да/Нет": "yn", "Выбор ответа": "mc", "Вписать ответ": "wr" };
const LETTERS = "АБВГ";
const SKIP_STATUSES = new Set(["исправить", "убрать"]);

function text(cell) {
  if (!cell || cell.value === null || cell.value === undefined) return "";
  return String(cell.text ?? cell.value).trim();
}

async function readQuestions(decksByFile) {
  const file = join(CONTENT, "Банк_вопросов.xlsx");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const ws = wb.getWorksheet("Вопросы");
  if (!ws) throw new Error("В таблице нет листа «Вопросы»");

  const questions = [];
  const problems = [];
  const ids = new Set();
  let skipped = 0;

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const c = (i) => text(row.getCell(i));
    const where = `строка ${rowNumber}`;
    const id = Number.parseInt(c(1), 10);
    const question = c(4);
    if (!question) return;
    if (!Number.isInteger(id)) return problems.push(`${where}: нет номера в колонке A`);
    if (ids.has(id)) return problems.push(`${where}: номер ${id} повторяется`);
    ids.add(id);

    const status = c(14).toLowerCase();
    if (SKIP_STATUSES.has(status)) {
      skipped += 1;
      return;
    }

    const f = FORMATS[c(2)];
    if (!f) return problems.push(`${where}: неизвестный формат «${c(2)}»`);
    const deck = decksByFile.get(c(12));
    if (!deck) return problems.push(`${where}: документ «${c(12)}» не описан в content/decks.json`);

    const item = { id, d: deck.id, f, t: c(3), q: question, x: c(11), l: Number.parseInt(c(13), 10) || 2 };
    if (status === "да") item.ok = 1;

    const answer = c(9);
    if (f === "yn") {
      if (answer !== "Да" && answer !== "Нет") return problems.push(`${where}: ответ должен быть «Да» или «Нет»`);
      item.a = answer;
    } else if (f === "mc") {
      const options = [c(5), c(6), c(7), c(8)];
      if (options.some((o) => !o)) return problems.push(`${where}: нужно четыре варианта`);
      const index = LETTERS.indexOf(answer.charAt(0));
      if (index < 0) return problems.push(`${where}: верный ответ должен начинаться с буквы А–Г`);
      item.o = options;
      item.a = index;
    } else {
      if (!answer) return problems.push(`${where}: пустой ответ`);
      item.a = answer;
      item.acc = c(10)
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);
      if (item.acc.length === 0) item.acc = [answer];
    }
    questions.push(item);
  });

  return { questions, problems, skipped };
}

function readPuzzles() {
  const dir = join(CONTENT, "puzzles");
  if (!existsSync(dir)) return { sets: [] };
  const sets = [];
  for (const name of readdirSync(dir).filter((n) => n.endsWith(".json")).sort()) {
    const data = JSON.parse(readFileSync(join(dir, name), "utf8"));
    sets.push(data);
  }
  sets.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  return { sets };
}

async function main() {
  const decksConfig = JSON.parse(readFileSync(join(CONTENT, "decks.json"), "utf8"));
  const decksByFile = new Map(decksConfig.decks.map((d) => [d.file, d]));
  const { questions, problems, skipped } = await readQuestions(decksByFile);

  if (problems.length > 0) {
    console.error("Ошибки в таблице вопросов:\n" + problems.join("\n"));
    process.exit(1);
  }

  const counts = new Map();
  for (const q of questions) counts.set(q.d, (counts.get(q.d) ?? 0) + 1);
  const decks = {
    groups: decksConfig.groups,
    decks: decksConfig.decks
      .map((d) => ({ id: d.id, title: d.title, group: d.group, source: d.source, count: counts.get(d.id) ?? 0 }))
      .filter((d) => d.count > 0),
  };

  const puzzles = readPuzzles();
  const version = createHash("sha1")
    .update(JSON.stringify([questions, decks, puzzles]))
    .digest("hex")
    .slice(0, 10);

  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, "questions.json"), JSON.stringify({ v: version, questions }));
  writeFileSync(join(OUT, "decks.json"), JSON.stringify({ v: version, ...decks }));
  writeFileSync(join(OUT, "puzzles.json"), JSON.stringify({ v: version, ...puzzles }));

  const puzzleCount = puzzles.sets.reduce((n, s) => n + s.items.length, 0);
  console.log(
    `Вопросов: ${questions.length} (пропущено с пометкой «Исправить»/«Убрать»: ${skipped}), колод: ${decks.decks.length}, головоломок: ${puzzleCount}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
