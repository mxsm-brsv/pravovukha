"use client";

import { answeredToday, dayKey, visibleStreak } from "@pravovukha/shared";
import Link from "next/link";
import { Cell } from "@/components/ui/Cell";
import { Icon } from "@/components/ui/Icon";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Screen } from "@/components/ui/Screen";
import { Section } from "@/components/ui/Section";
import { useContent } from "@/data/content";
import { useLoadedContent } from "@/data/hooks";
import { days, documentsDative, questions } from "@/lib/plural";
import { href } from "@/lib/routes";
import { useEnvStore } from "@/stores/env";
import { useProfileStore } from "@/stores/profile";
import { haptic } from "@/tma/haptics";

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

function StartSection() {
  const status = useLoadedContent();
  const total = useContent((s) => s.questions.length);
  const decks = useContent((s) => s.decks.length);
  const puzzles = useContent((s) => s.puzzles.reduce((n, set) => n + set.items.length, 0));
  const ready = status === "ready";

  return (
    <>
      <Section header="Начать" footer={ready ? `${questions(total)} с пояснениями по ${documentsDative(decks)} проекта «Правовуха».` : undefined}>
        <Cell href="/learn/train?deck=all" icon="shuffle" iconTone="blue" title="Тренировка" subtitle="10 вопросов: сначала ошибки и новые" />
        <Cell href="/learn/exam?deck=all" icon="timer" iconTone="orange" title="Экзамен" subtitle="20 вопросов за 20 минут, не больше двух ошибок" />
        <Cell href="/learn" icon="book" iconTone="green" title="Темы и документы" subtitle="Устав, законы, приказы, положения СКС" />
      </Section>
      <Section header="Играть">
        <Cell href="/play/two-one" icon="duel" iconTone="violet" title="2 к 1" subtitle="Пять права на ошибку" />
        <Cell href="/play/biathlon" icon="target2" iconTone="teal" title="Правовой биатлон" subtitle="На время, до первой ошибки" />
        <Cell href="/play" icon="puzzle" iconTone="red" title="Головоломки" subtitle={ready ? `${puzzles} ребусов, шифров и загадок` : "Ребусы, шифры и загадки"} />
      </Section>
    </>
  );
}

export default function HomePage() {
  return (
    <Screen title="С правовухой на ты" subtitle={<Greeting />}>
      <TodayCard />

      <StartSection />
    </Screen>
  );
}
