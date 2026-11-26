"use client";

import { assetUrl } from "@/data/assets";
import { APP_VERSION } from "@/lib/version";
import { getWebApp, isInTelegram } from "@/tma/telegram";

/**
 * Сообщения о неточностях. Куда они уходят, задаётся в public/config.json:
 *   reportUrl     — адрес веб-приложения Google Apps Script: строка попадает в Google-таблицу,
 *                   а на почту приходит письмо (см. content/report/README.md);
 *   reportContact — имя пользователя в Telegram без @: текст копируется и открывается чат.
 * Если ничего не задано, текст просто копируется в буфер обмена.
 * В сообщение не попадают имя и аккаунт пользователя.
 */
export const REPORT_KINDS = [
  { id: "answer", title: "Неверный ответ" },
  { id: "wording", title: "Неточная формулировка" },
  { id: "outdated", title: "Устаревшая норма" },
  { id: "other", title: "Другое" },
] as const;

export type ReportKind = (typeof REPORT_KINDS)[number]["id"];

export interface ReportPayload {
  /** Номер вопроса или id головоломки. */
  id: string;
  kind: ReportKind;
  comment: string;
  question: string;
  answer: string;
  mode: string;
}

interface Config {
  reportUrl?: string;
  reportContact?: string;
}

let configPromise: Promise<Config> | null = null;

function loadConfig(): Promise<Config> {
  if (!configPromise) {
    configPromise = fetch(assetUrl("config.json"), { cache: "no-cache" })
      .then((r) => (r.ok ? (r.json() as Promise<Config>) : {}))
      .catch(() => ({}));
  }
  return configPromise;
}

export function reportText(p: ReportPayload): string {
  const kind = REPORT_KINDS.find((k) => k.id === p.kind)?.title ?? p.kind;
  return [
    `Неточность в вопросе № ${p.id}: ${kind}`,
    `Вопрос: ${p.question}`,
    `Ответ в приложении: ${p.answer}`,
    p.comment ? `Комментарий: ${p.comment}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export type ReportResult = "sent" | "opened" | "copied" | "manual" | "failed";

export async function sendReport(payload: ReportPayload): Promise<ReportResult> {
  const config = await loadConfig();
  const url = config.reportUrl?.trim();
  if (url) {
    const body = new URLSearchParams({ ...payload, version: APP_VERSION });
    try {
      // Google Apps Script не отдаёт CORS-заголовки, поэтому отправляем «вслепую».
      await fetch(url, { method: "POST", mode: "no-cors", body });
      return "sent";
    } catch {
      return "failed";
    }
  }

  const text = reportText(payload);
  const copied = await copy(text);
  const contact = config.reportContact?.trim().replace(/^@/, "");
  if (contact) {
    const link = `https://t.me/${contact}`;
    const wa = getWebApp();
    if (wa && isInTelegram()) wa.openTelegramLink(link);
    else window.open(link, "_blank", "noopener");
    return "opened";
  }
  return copied ? "copied" : "manual";
}
