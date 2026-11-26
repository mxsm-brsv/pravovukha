"use client";

import { DAILY_GOALS, type DailyGoal } from "@pravovukha/shared";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Cell } from "@/components/ui/Cell";
import { Icon } from "@/components/ui/Icon";
import { Screen } from "@/components/ui/Screen";
import { Section } from "@/components/ui/Section";
import { questions } from "@/lib/plural";
import { href } from "@/lib/routes";
import { spring } from "@/motion/presets";
import { useProfileStore } from "@/stores/profile";
import { haptic } from "@/tma/haptics";
import { useMainButton } from "@/tma/useMainButton";

/** Примерное время в день: около полуминуты на вопрос вместе с чтением пояснения. */
const MINUTES: Record<DailyGoal, string> = {
  10: "около 5 минут в день",
  20: "около 10 минут в день",
  30: "около 15 минут в день",
  50: "около 25 минут в день",
};

const LABELS: Record<DailyGoal, string> = {
  10: "Спокойно",
  20: "Обычно",
  30: "Серьёзно",
  50: "Перед конкурсом",
};

export default function GoalPage() {
  const router = useRouter();
  const status = useProfileStore((s) => s.status);
  const saved = useProfileStore((s) => s.profile.settings.dailyGoal);
  const update = useProfileStore((s) => s.update);
  const [selected, setSelected] = useState<DailyGoal>(saved);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  // Профиль мог загрузиться уже после открытия экрана по ссылке — подтягиваем сохранённое значение.
  useEffect(() => {
    if (!touched) setSelected(saved);
  }, [saved, touched]);

  const changed = selected !== saved;

  const save = useCallback(async () => {
    if (!changed || saving) return;
    setSaving(true);
    await update((p) => ({ ...p, settings: { ...p.settings, dailyGoal: selected } }));
    setSaving(false);
    if (useProfileStore.getState().saveError) {
      haptic.wrong();
      return;
    }
    haptic.correct();
    router.push(href("/profile"));
  }, [changed, saving, update, selected, router]);

  useMainButton({ text: "Сохранить", onClick: save, enabled: changed && status === "ready", loading: saving });

  const saveError = useProfileStore((s) => s.saveError);

  return (
    <Screen title="Дневная цель" subtitle="Сколько вопросов решать в день. Серия растёт, когда цель выполнена.">
      <Section
        role="radiogroup"
        label="Дневная цель"
        footer={
          saveError ? (
            <span className="text-error">Не удалось сохранить. Проверьте интернет и нажмите «Сохранить» ещё раз.</span>
          ) : (
            "Цель можно поменять в любой момент, серия при этом не сбрасывается."
          )
        }
      >
        {DAILY_GOALS.map((goal) => {
          const active = goal === selected;
          return (
            <Cell
              key={goal}
              role="radio"
              selected={active}
              onClick={() => {
                if (active) return;
                haptic.select();
                setTouched(true);
                setSelected(goal);
              }}
              title={`${questions(goal)} · ${LABELS[goal]}`}
              subtitle={MINUTES[goal]}
              after={
                <span className="flex h-6 w-6 items-center justify-center text-button">
                  <AnimatePresence initial={false}>
                    {active && (
                      <motion.span
                        key="check"
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.4, opacity: 0 }}
                        transition={spring.bouncy}
                      >
                        <Icon name="check" size={22} strokeWidth={2.6} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              }
            />
          );
        })}
      </Section>
    </Screen>
  );
}
