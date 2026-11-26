"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { assetUrl } from "@/data/assets";
import type { PuzzleCalendar, PuzzleItem, PuzzleSwatch } from "@/data/types";
import { cx } from "@/lib/cx";
import { AudioClip } from "./AudioClip";

const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const WEEKDAYS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

/** Картинка задания; по нажатию открывается на весь экран. */
export function PuzzleImage({ src, alt }: { src: string; alt: string }) {
  const [zoom, setZoom] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setZoom(true)} className="block w-full overflow-hidden rounded-2xl bg-white">
        <img src={assetUrl(src)} alt={alt} className="block h-auto w-full" loading="lazy" decoding="async" />
      </button>
      <AnimatePresence>
        {zoom && (
          <motion.button
            type="button"
            aria-label="Закрыть"
            onClick={() => setZoom(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2"
          >
            <img src={assetUrl(src)} alt={alt} className="max-h-full max-w-full object-contain" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}

function Swatches({ items }: { items: PuzzleSwatch[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((s) => (
        <div key={s.hex} className="overflow-hidden rounded-2xl bg-section">
          <div className="h-24 border-b border-separator" style={{ background: s.hex }} />
          <div className="px-3 py-2">
            <p className="font-mono text-[14px] text-fg">{s.hex.toUpperCase()}</p>
            {s.name && <p className="text-[12px] text-hint">{s.name}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function Calendar({ calendar }: { calendar: PuzzleCalendar }) {
  const first = new Date(calendar.year, calendar.month - 1, 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(calendar.year, calendar.month, 0).getDate();
  const cells = [...Array.from({ length: offset }, () => 0), ...Array.from({ length: days }, (_, i) => i + 1)];
  return (
    <div className="rounded-2xl bg-section p-4">
      <p className="mb-3 text-center text-[19px] font-semibold text-fg">
        {MONTHS[calendar.month - 1]} {calendar.year}
      </p>
      <div className="grid grid-cols-7 gap-y-1.5 text-center">
        {WEEKDAYS.map((d, i) => (
          <span key={d} className={cx("text-[13px]", i >= 5 ? "text-error" : "text-hint")}>
            {d}
          </span>
        ))}
        {cells.map((day, i) => {
          const marked = day > 0 && calendar.marks.includes(day);
          const weekend = i % 7 >= 5;
          return (
            <span key={i} className="flex items-center justify-center">
              {day > 0 && (
                <span
                  className={cx(
                    "flex h-9 w-9 items-center justify-center rounded-full text-[16px] tabular-nums",
                    marked ? "ring-2 ring-error font-semibold text-fg" : weekend ? "text-error" : "text-fg",
                  )}
                >
                  {day}
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

const KEYS: Array<[string, string]> = [
  ["1", ""], ["2", "АБВГ"], ["3", "ДЕЖЗ"], ["4", "ИЙКЛ"], ["5", "МНОП"], ["6", "РСТУ"], ["7", "ФХЦЧ"], ["8", "ШЩЪЫ"], ["9", "ЬЭЮЯ"],
];

function Keypad({ code }: { code: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-section p-4">
      <p className="font-mono text-[18px] leading-relaxed whitespace-pre-line text-fg">{code}</p>
      <div className="grid grid-cols-3 gap-2 self-center">
        {KEYS.map(([digit, letters]) => (
          <span key={digit} className="flex h-12 w-16 flex-col items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--app-fg)_7%,transparent)]">
            <span className="text-[17px] font-semibold text-fg">{digit}</span>
            <span className="text-[10px] tracking-wider text-hint">{letters}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Всё, что нужно для задания: картинка, текст, код, цвета, календарь, звук. */
export function PuzzleMedia({ item }: { item: PuzzleItem }) {
  return (
    <div className="flex flex-col gap-3">
      {item.image && <PuzzleImage src={item.image} alt={item.prompt} />}
      {item.rebus && (
        <div className="rounded-2xl bg-section px-4 py-8 text-center text-[44px] leading-tight font-semibold text-fg">{item.rebus}</div>
      )}
      {item.text && (
        <div
          className={cx(
            "rounded-2xl bg-section p-4 whitespace-pre-line text-fg",
            item.text.length < 40 ? "text-center font-mono text-[26px] font-semibold tracking-wide" : "text-[16px] leading-relaxed",
          )}
        >
          {item.text}
        </div>
      )}
      {item.t9 && <Keypad code={item.t9} />}
      {item.swatches && <Swatches items={item.swatches} />}
      {item.calendar && <Calendar calendar={item.calendar} />}
      {item.audio && <AudioClip audio={item.audio} />}
    </div>
  );
}
