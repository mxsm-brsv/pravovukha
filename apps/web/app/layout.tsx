import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "С правовухой на ты",
  description: "Бесплатный тренажёр правовой грамотности для конкурсов Профсоюза: вопросы с пояснениями, экзамен и головоломки.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

/**
 * Тему выставляем до первой отрисовки, чтобы в тёмной теме не мигал белый экран.
 * Скрипт Telegram подключён выше и уже создал window.Telegram.WebApp.
 */
const schemeScript = `(function(){try{var w=window.Telegram&&window.Telegram.WebApp;var dark=w&&w.initData?w.colorScheme==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.dataset.scheme=dark?"dark":"light";}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        {/* Telegram требует подключать свой скрипт в <head> раньше остальных, синхронно. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://telegram.org/js/telegram-web-app.js" />
        <script dangerouslySetInnerHTML={{ __html: schemeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
