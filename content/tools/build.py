"""
Сборка нового банка вопросов из q/<документ>.jsonl в xlsx того же вида, что «Банк_вопросов_правовуха.xlsx».

Строка jsonl:
  {"f":"yn","t":"Тема","q":"Утверждение","a":"Да","ref":"п. 5 ст. 2","e":"суть нормы","d":1}
  {"f":"mc","t":"Тема","q":"Вопрос?","o":["А","Б","В","Г"],"a":2,"ref":"...","e":"...","d":2}   a — индекс верного варианта 0–3
  {"f":"wr","t":"Тема","q":"Вопрос","a":"Ответ","acc":["ответ","вариант"],"ref":"...","e":"...","d":1}
Пояснение собирается так: «<ответ> (Согласно <ref> <документ>: <e>)».

Запуск: python3 tools/build.py [выходной.xlsx]   — проверка + сборка; ошибки печатаются и сборку останавливают.
"""
import difflib
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from docs import DOCS  # noqa: E402

ORDER = [
    "ustav", "fz273", "fz10", "vznosy", "uchet", "krk", "konf", "sks", "prezid", "deklar", "prior",
    "otrasl", "gensogl", "pm245", "pm1663", "pm284", "pm303", "pm607", "pm822", "pm606", "pm807",
    "pm885", "pm1010", "pp1190", "pp1441", "pp555", "pp1390", "zhk", "fz53", "fz152", "fz82",
    "fz135", "fz489", "up809", "up309", "proekty", "saity", "minist", "brand", "lidbrand", "lidpol",
]
START_NUMBER = 137
LETTERS = "АБВГ"
FORMATS = {"yn": "Да/Нет", "mc": "Выбор ответа", "wr": "Вписать ответ"}


def norm(s: str) -> str:
    s = s.lower().replace("ё", "е")
    s = re.sub(r"[«»\"'“”„.,;:!?()\-–—…]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def load():
    items, errors = [], []
    files = {p.stem: p for p in (ROOT / "q").glob("*.jsonl")}
    orig = files.pop("original", None)
    if orig:
        for n, line in enumerate(orig.read_text(encoding="utf-8").splitlines(), 1):
            if line.strip():
                r = json.loads(line)
                r["_doc"], r["_line"], r["_orig"] = r["doc"], n, True
                items.append(r)
    unknown = set(files) - set(ORDER)
    if unknown:
        errors.append(f"Файлы без места в ORDER: {sorted(unknown)}")
    for key in ORDER:
        p = files.get(key)
        if not p:
            continue
        if key not in DOCS:
            errors.append(f"{key}: нет в DOCS")
            continue
        for n, line in enumerate(p.read_text(encoding="utf-8").splitlines(), 1):
            line = line.strip()
            if not line or line.startswith("//"):
                continue
            try:
                r = json.loads(line)
            except json.JSONDecodeError as e:
                errors.append(f"{key}:{n}: JSON {e}")
                continue
            r["_doc"], r["_line"] = key, n
            items.append(r)
    return items, errors


def check(r) -> list[str]:
    where = f"{'original' if r.get('_orig') else r['_doc']}:{r['_line']}"
    errs = []
    f = r.get("f")
    if f not in FORMATS:
        return [f"{where}: формат {f!r}"]
    for k in (("t", "q", "x") if r.get("_orig") else ("t", "q", "ref", "e")):
        if not str(r.get(k, "")).strip():
            errs.append(f"{where}: пусто поле {k}")
    if r.get("d") not in (1, 2, 3):
        errs.append(f"{where}: сложность {r.get('d')!r}")
    q = r.get("q", "")
    if '"' in q or '"' in r.get("e", ""):
        errs.append(f"{where}: прямые кавычки — используйте «»")
    if f == "yn":
        if r.get("a") not in ("Да", "Нет"):
            errs.append(f"{where}: ответ Да/Нет")
        if q.endswith("?"):
            errs.append(f"{where}: утверждение Да/Нет не должно заканчиваться «?»")
        if "o" in r:
            errs.append(f"{where}: у Да/Нет нет вариантов")
    elif f == "mc":
        o = r.get("o")
        if not (isinstance(o, list) and len(o) == 4 and all(str(x).strip() for x in o)):
            errs.append(f"{where}: нужно 4 варианта")
        elif len({norm(x) for x in o}) != 4:
            errs.append(f"{where}: повтор вариантов")
        if r.get("a") not in (0, 1, 2, 3):
            errs.append(f"{where}: a — индекс 0–3")
    elif f == "wr":
        a = str(r.get("a", "")).strip()
        acc = r.get("acc")
        if not a:
            errs.append(f"{where}: пустой ответ")
        if not (isinstance(acc, list) and acc):
            errs.append(f"{where}: нужен список acc")
        elif norm(a) not in {norm(x) for x in acc}:
            errs.append(f"{where}: основной ответ «{a}» не входит в acc")
        if len(a) > 80:
            errs.append(f"{where}: слишком длинный ответ для вписывания")
    return errs


def _first_num(x):
    m = re.search(r"(\d+)(?:[,.](\d+)|/(\d+)|:(\d+))?", str(x))
    if not m:
        return None
    a = float(m.group(1))
    if m.group(2):
        return float(f"{m.group(1)}.{m.group(2)}")
    if m.group(3):
        return a / float(m.group(3))
    if m.group(4):
        return a / float(m.group(4))
    return a


def balance_letters(items) -> None:
    """Верный вариант по очереди ставится на А, Б, В, Г (поворотом списка, порядок вариантов сохраняется).
    Варианты-числа («6», «10 лет») не трогаем: их удобнее читать по возрастанию."""
    target = 0
    for r in items:
        if r.get("f") != "mc" or not isinstance(r.get("o"), list) or len(r["o"]) != 4 or r.get("a") not in (0, 1, 2, 3):
            continue
        if r.get("_orig"):
            continue
        if all(re.match(r"^\s*(не |до |от |более |менее |с |в |через |за |примерно |около )?\d", str(x).lower()) for x in r["o"]):
            nums = [_first_num(x) for x in r["o"]]
            if None not in nums and len(set(nums)) == 4:
                right = r["o"][r["a"]]
                r["o"] = [x for _, x in sorted(zip(nums, r["o"]))]
                r["a"] = r["o"].index(right)
            continue
        shift = (r["a"] - target) % 4
        r["o"] = r["o"][shift:] + r["o"][:shift]
        r["a"] = target
        target = (target + 1) % 4


def answer_text(r) -> str:
    if r["f"] == "mc":
        return r["o"][r["a"]]
    return str(r["a"])


def explanation(r) -> str:
    if r.get("x"):
        return r["x"]
    cite = DOCS[r["_doc"]][1]
    body = r["e"].strip().rstrip(".")
    return f"{answer_text(r)} (Согласно {r['ref'].strip()} {cite}: {body})"


def read_existing(path: Path):
    """Строки уже существующей таблицы: правки в ней важнее исходников, их не трогаем."""
    from openpyxl import load_workbook
    ws = load_workbook(path)["Вопросы"]
    rows = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        if row and row[0] is not None and row[3]:
            rows.append(list(row[:15]) + [None] * (15 - len(row[:15])))
    return rows


def row_for(r, n) -> list:
    opts = r.get("o", ["", "", "", ""]) if r["f"] == "mc" else ["", "", "", ""]
    correct = f"{LETTERS[r['a']]} — {r['o'][r['a']]}" if r["f"] == "mc" else str(r["a"])
    acc = "; ".join(r.get("acc", [])) if r["f"] == "wr" else ""
    return [n, FORMATS[r["f"]], r["t"], r["q"], *opts, correct, acc, explanation(r), DOCS[r["_doc"]][0], r["d"], "", ""]


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    fresh = "--fresh" in sys.argv
    out = Path(args[0]) if args else ROOT / "Банк_вопросов.xlsx"
    items, errors = load()
    for r in items:
        errors += check(r)

    originals = [norm(r["q"]) for r in items if r.get("_orig")]
    seen: dict[str, str] = {}
    warnings = []
    for r in items:
        key = norm(r.get("q", ""))
        where = f"{'original' if r.get('_orig') else r['_doc']}:{r['_line']}"
        if key in seen:
            errors.append(f"{where}: дубль вопроса {seen[key]}")
        seen[key] = where
        if r.get("_orig"):
            continue
        for ex in originals:
            if difflib.SequenceMatcher(None, key, ex).ratio() > 0.86:
                warnings.append(f"{where}: похоже на исходный вопрос «{ex[:70]}»")
                break

    balance_letters(items)

    if errors:
        print("ОШИБКИ:")
        print("\n".join(errors))
        sys.exit(1)

    by_fmt = Counter(r["f"] for r in items)
    yn = Counter(r["a"] for r in items if r["f"] == "yn")
    print(f"В исходниках: {len(items)} | форматы {dict(by_fmt)} | Да/Нет {dict(yn)}")
    for w in warnings:
        print("ВНИМАНИЕ", w)

    if out.exists() and not fresh:
        rows = read_existing(out)
        known = {norm(str(row[3])) for row in rows}
        nxt = max(int(row[0]) for row in rows) + 1
        added = 0
        for r in items:
            if norm(r["q"]) not in known:
                rows.append(row_for(r, nxt))
                nxt += 1
                added += 1
        print(f"Таблица уже есть: сохранены {len(rows) - added} строк с правками, добавлено новых: {added}")
    else:
        rows, nxt = [], START_NUMBER
        for r in items:
            if r.get("_orig"):
                rows.append(row_for(r, r["n"]))
            else:
                rows.append(row_for(r, nxt))
                nxt += 1
        rows.sort(key=lambda row: row[0])
    write_xlsx(rows, out)
    print("Готово:", out, "строк:", len(rows))


def write_xlsx(rows_data, out: Path):
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font, PatternFill
    from openpyxl.worksheet.datavalidation import DataValidation

    wb = Workbook()
    info = wb.active
    info.title = "Как читать"
    rows = [
        ("Что это", "Банк вопросов тренажёра «С правовухой на ты»: № 1–136 — первый банк, дальше — вопросы по всем документам проекта «Правовуха». К каждому вопросу — пояснение со ссылкой на пункт или статью. Приложение собирается из этой таблицы."),
        ("Да/Нет", "Утверждение. Игрок жмёт «Да» или «Нет». После ответа показывается пояснение с нормой."),
        ("Выбор ответа", "Вопрос и 4 варианта. В приложении порядок вариантов перемешивается."),
        ("Вписать ответ", "Короткий ответ: число, термин, название. Засчитывается любое написание из колонки «Принимаемые написания» — без учёта регистра, ё/е и кавычек."),
        ("Сложность", "1 — базовая норма, которую должен знать каждый; 2 — деталь или срок; 3 — редкая подробность."),
        ("Что заполнить", "Жёлтые колонки N и O. В «Проверено юристом» выберите «Да», «Исправить» или «Убрать», в комментарии — что поправить. Вопросы с «Исправить» и «Убрать» в приложение не попадают, остальные попадают."),
        ("Как поправить", "Исправьте текст прямо в строке и сохраните файл. После отправки на GitHub приложение пересоберётся само. Номер в колонке A не меняйте: по нему в приложении хранится прогресс."),
        ("Где искать норму", "В пояснении указан пункт или статья, в колонке L — файл в проекте."),
    ]
    info.column_dimensions["A"].width = 24
    info.column_dimensions["B"].width = 110
    info.append(("Как пользоваться таблицей",))
    info["A1"].font = Font(bold=True, size=13)
    for row in rows:
        info.append(row)
    for row in info.iter_rows(min_row=2):
        row[0].font = Font(bold=True)
        for c in row:
            c.alignment = Alignment(wrap_text=True, vertical="top")

    ws = wb.create_sheet("Вопросы")
    header = ["№", "Формат", "Тема", "Вопрос (как на карточке)", "Вариант А", "Вариант Б", "Вариант В", "Вариант Г",
              "Верный ответ", "Принимаемые написания (для «Вписать ответ»)", "Пояснение после ответа",
              "Документ в проекте", "Сложность (1–3)", "Проверено юристом", "Комментарий проверяющего"]
    ws.append(header)
    widths = [6, 13, 22, 60, 22, 22, 22, 22, 26, 26, 80, 26, 10, 14, 30]
    for i, w in enumerate(widths):
        ws.column_dimensions[chr(65 + i)].width = w
    yellow = PatternFill("solid", fgColor="FFF2CC")
    head_fill = PatternFill("solid", fgColor="DDEBF7")
    for c in ws[1]:
        c.font = Font(bold=True)
        c.fill = head_fill
        c.alignment = Alignment(wrap_text=True, vertical="center")
    for row in rows_data:
        ws.append(["" if v is None else v for v in row])
    for row in ws.iter_rows(min_row=2):
        for c in row:
            c.alignment = Alignment(wrap_text=True, vertical="top")
        row[13].fill = yellow
        row[14].fill = yellow
    dv = DataValidation(type="list", formula1='"Да,Исправить,Убрать"', allow_blank=True)
    ws.add_data_validation(dv)
    dv.add(f"N2:N{len(rows_data) + 1}")
    ws.freeze_panes = "E2"
    ws.auto_filter.ref = f"A1:O{len(rows_data) + 1}"

    sm = wb.create_sheet("Сводка")
    sm.append(("Банк вопросов — сводка",))
    sm["A1"].font = Font(bold=True, size=13)
    last = len(rows_data) + 1
    sm.append(("Формат", "Вопросов", "Проверено юристом"))
    for f in FORMATS.values():
        sm.append((f, f'=COUNTIF(Вопросы!B2:B{last},"{f}")', f'=COUNTIFS(Вопросы!B2:B{last},"{f}",Вопросы!N2:N{last},"Да")'))
    sm.append(("Всего", f"=COUNTA(Вопросы!A2:A{last})", f'=COUNTIF(Вопросы!N2:N{last},"Да")'))
    sm.append(())
    sm.append(("Документ", "Вопросов", "Проверено юристом"))
    for name in dict.fromkeys(str(row[11]) for row in rows_data):
            sm.append((name, f'=COUNTIF(Вопросы!L2:L{last},"{name}")', f'=COUNTIFS(Вопросы!L2:L{last},"{name}",Вопросы!N2:N{last},"Да")'))
    sm.append(())
    sm.append(("Тема", "Вопросов"))
    for t in dict.fromkeys(str(row[2]) for row in rows_data):
        sm.append((t, f'=COUNTIF(Вопросы!C2:C{last},"{t}")'))
    sm.column_dimensions["A"].width = 52
    sm.column_dimensions["B"].width = 12
    sm.column_dimensions["C"].width = 20
    for row in sm.iter_rows():
        if row[0].value in ("Формат", "Документ", "Тема"):
            for c in row:
                c.font = Font(bold=True)

    out.parent.mkdir(parents=True, exist_ok=True)
    wb.save(out)


if __name__ == "__main__":
    main()
