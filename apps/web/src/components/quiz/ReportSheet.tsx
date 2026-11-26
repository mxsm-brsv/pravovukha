"use client";

import { useState } from "react";
import { cx } from "@/lib/cx";
import { REPORT_KINDS, reportText, sendReport, type ReportKind, type ReportResult } from "@/lib/report";
import { haptic } from "@/tma/haptics";
import { Icon } from "../ui/Icon";
import { Sheet } from "../ui/Sheet";

interface ReportSheetProps {
  open: boolean;
  onClose: () => void;
  id: string;
  question: string;
  answer: string;
  mode: string;
}

const RESULT_TEXT: Record<ReportResult, string> = {
  sent: "Спасибо! Сообщение отправлено, вопрос проверят.",
  opened: "Текст скопирован — вставьте его в открывшийся чат.",
  copied: "Текст сообщения скопирован. Отправьте его организатору.",
  manual: "Скопируйте текст ниже и отправьте его организатору.",
  failed: "Не получилось отправить. Попробуйте ещё раз позже.",
};

/** Анонимное сообщение о неточности в вопросе: категория и комментарий. */
export function ReportSheet({ open, onClose, id, question, answer, mode }: ReportSheetProps) {
  const [kind, setKind] = useState<ReportKind>("answer");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<ReportResult | null>(null);

  const close = () => {
    onClose();
    window.setTimeout(() => {
      setResult(null);
      setComment("");
      setKind("answer");
    }, 300);
  };

  const submit = async () => {
    setSending(true);
    const r = await sendReport({ id, kind, comment: comment.trim(), question, answer, mode });
    setSending(false);
    setResult(r);
    if (r === "failed") haptic.wrong();
    else haptic.correct();
  };

  return (
    <Sheet open={open} onClose={close} title="Сообщить о неточности">
      {result ? (
        <div className="pb-2">
          <p className="rounded-2xl bg-section p-4 text-[16px] leading-snug text-fg">{RESULT_TEXT[result]}</p>
          {result === "manual" && (
            <textarea
              readOnly
              rows={5}
              value={reportText({ id, kind, comment: comment.trim(), question, answer, mode })}
              onFocus={(e) => e.currentTarget.select()}
              className="mt-3 w-full resize-none rounded-2xl bg-section p-3 text-[14px] text-fg outline-none"
            />
          )}
          <button type="button" onClick={close} className="mt-3 h-12 w-full rounded-xl bg-button text-[17px] font-semibold text-button-fg">
            Готово
          </button>
        </div>
      ) : (
        <div className="pb-2">
          <p className="mb-3 px-1 text-[14px] leading-snug text-hint">
            Вопрос № {id}. Сообщение анонимное: имя и аккаунт не передаются.
          </p>
          <div role="radiogroup" aria-label="Что не так" className="overflow-hidden rounded-2xl bg-section divide-y divide-separator">
            {REPORT_KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                role="radio"
                aria-checked={kind === k.id}
                onClick={() => {
                  haptic.select();
                  setKind(k.id);
                }}
                className="pressable flex min-h-[46px] w-full items-center justify-between px-4 text-left text-[17px] text-fg"
              >
                {k.title}
                {kind === k.id && <Icon name="check" size={20} className="text-link" />}
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Что поправить? Например, номер пункта или верный ответ"
            rows={3}
            maxLength={1000}
            className="mt-3 w-full resize-none rounded-2xl bg-section p-3 text-[16px] text-fg outline-none placeholder:text-hint"
          />
          <button
            type="button"
            disabled={sending}
            onClick={submit}
            className={cx(
              "mt-3 h-12 w-full rounded-xl bg-button text-[17px] font-semibold text-button-fg",
              sending && "opacity-60",
            )}
          >
            {sending ? "Отправляем…" : "Отправить"}
          </button>
        </div>
      )}
    </Sheet>
  );
}
