"use client";

import { answeredToday, dayKey, visibleStreak } from "@pravovukha/shared";
import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Screen } from "@/components/ui/Screen";
import { Section } from "@/components/ui/Section";
import { days, questions } from "@/lib/plural";
import { href } from "@/lib/routes";
import { useEnvStore } from "@/stores/env";
import { useProfileStore } from "@/stores/profile";
import { haptic } from "@/tma/haptics";

const MODES: ReadonlyArray<{ icon: IconName; title: string; text: string }> = [
  { icon: "cards", title: "Учить", text: "Карточки и тесты с пояснением к каждому ответу. Трудные вопросы возвращаются чаще." },
  { icon: "timer", title: "Экзамен", text: "20 вопросов за 20 минут, не больше двух ошибок. За ошибку — пять дополнительных вопросов." },
  { icon: "puzzle", title: "Играть", text: "Головоломки по нормам: собери статью, найди пару, расставь по порядку." },
  { icon: "calendar", title: "Дело дня", text: "Одна ситуация в день, одна и та же у всех." },
];

function Greeting() {
  const ready = useEnvStore((s) => s.ready);
  const firstName = useEnvStore((s) => s.user?.firstName ?? null);
  const name = ready && firstName ? `, ${firstName}` : "";
  return (
    <>
      Привет{name}! Готовьтесь к конкурсам по правовой грамотности: вопросы, пояснения и экзамен — бесплатно и без
      регистрации.
    </>
  );
}

function TodayCard() {
  const status = useProfileStore((s) => s.status);
  const profile = useProfileStore((s) => s.profile);
  const ready = status === "ready";
  const today = dayKey(new Date());
  const goal = profile.settings.dailyGoal;
  const answered = ready ? answeredToday(profile, today) : 0;
  const streak = ready ? visibleStreak(profile.streak, today) : 0;

  return (
    <Section header="Сегодня" padded>
      <div className="flex items-center gap-4">
        <ProgressRing value={answered / goal} label={`Дневная цель: ${answered} из ${goal}`}>
          <span className="text-[22px] leading-none font-bold text-fg tabular-nums">{ready ? answered : "–"}</span>
          <span className="mt-0.5 text-[12px] text-hint tabular-nums">из {goal}</span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-semibold text-fg">
            {answered >= goal ? "Цель выполнена" : "Дневная цель"}
          </p>
          <p className="mt-0.5 text-[15px] leading-snug text-hint">
            {answered >= goal
              ? "Отличная работа. Можно продолжить или вернуться завтра."
              : `Ответьте на ${questions(goal)}, чтобы продлить серию.`}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1 text-[15px] font-medium ${streak > 0 ? "text-warning" : "text-hint"}`}
            >
              <Icon name="flame" size={18} />
              <span className="tabular-nums">{ready ? days(streak) : "…"}</span>
            </span>
            <Link href={href("/profile/goal")} onClick={() => haptic.tap()} className="text-[15px] text-link">
              Изменить цель
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
}

export default function HomePage() {
  return (
    <Screen title="С правовухой на ты" subtitle={<Greeting />}>
      <TodayCard />

      <Section header="Курс" padded footer="Мы сами пишем вопросы по документам и проверяем каждый, поэтому выпускаем их частями.">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--app-button)_14%,transparent)] text-button">
            <Icon name="scale" size={24} />
          </span>
          <div className="min-w-0">
            <p className="text-[17px] font-semibold text-fg">Банк вопросов готовится</p>
            <p className="mt-0.5 text-[15px] leading-snug text-hint">
              Вопросы с пояснениями по Уставу Профсоюза и законам об образовании появятся в ближайшем обновлении.
            </p>
          </div>
        </div>
      </Section>

      <Section header="Что будет внутри">
        {MODES.map((mode) => (
          <div key={mode.title} className="flex items-start gap-3 px-4 py-3">
            <Icon name={mode.icon} size={22} className="mt-0.5 shrink-0 text-button" />
            <div className="min-w-0">
              <p className="text-[16px] font-medium text-fg">{mode.title}</p>
              <p className="mt-0.5 text-[14px] leading-snug text-hint">{mode.text}</p>
            </div>
          </div>
        ))}
      </Section>
    </Screen>
  );
}
