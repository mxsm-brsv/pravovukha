"use client";

import { dayKey, visibleStreak } from "@pravovukha/shared";
import { Cell } from "@/components/ui/Cell";
import { Screen } from "@/components/ui/Screen";
import { Section } from "@/components/ui/Section";
import { Switch } from "@/components/ui/Switch";
import { days, questions } from "@/lib/plural";
import { APP_VERSION } from "@/lib/version";
import { useEnvStore } from "@/stores/env";
import { useProfileStore } from "@/stores/profile";
import { haptic } from "@/tma/haptics";

const PLATFORM_NAMES: Record<string, string> = {
  android: "Android",
  android_x: "Android",
  ios: "iOS",
  macos: "macOS",
  tdesktop: "Telegram Desktop",
  weba: "Telegram Web A",
  webk: "Telegram Web K",
  web: "Telegram Web",
  unigram: "Unigram",
};

function UserCard() {
  const ready = useEnvStore((s) => s.ready);
  const user = useEnvStore((s) => s.user);
  const inTelegram = useEnvStore((s) => s.inTelegram);

  const name = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") : "Гость";
  const initial = (user?.firstName ?? "Г").slice(0, 1).toUpperCase();
  const caption = !ready ? " " : user?.username ? `@${user.username}` : inTelegram ? "Аккаунт Telegram" : "Открыто в браузере";

  return (
    <div className="flex flex-col items-center pt-2 text-center">
      {user?.photoUrl ? (
        <img
          src={user.photoUrl}
          alt=""
          width={84}
          height={84}
          referrerPolicy="no-referrer"
          className="h-[84px] w-[84px] rounded-full object-cover"
        />
      ) : (
        <span className="flex h-[84px] w-[84px] items-center justify-center rounded-full bg-button text-[34px] font-semibold text-button-fg">
          {initial}
        </span>
      )}
      <p className="mt-3 text-[22px] font-semibold text-fg">{ready ? name : " "}</p>
      <p className="mt-0.5 text-[15px] text-hint">{caption}</p>
    </div>
  );
}

export default function ProfilePage() {
  const profile = useProfileStore((s) => s.profile);
  const status = useProfileStore((s) => s.status);
  const saveError = useProfileStore((s) => s.saveError);
  const update = useProfileStore((s) => s.update);
  const env = useEnvStore();

  const ready = status === "ready";
  const streak = ready ? visibleStreak(profile.streak, dayKey(new Date())) : 0;
  const { haptics, reduceMotion, dailyGoal } = profile.settings;

  const toggleHaptics = () => {
    const next = !haptics;
    void update((p) => ({ ...p, settings: { ...p.settings, haptics: next } }));
    // Отклик после включения подтверждает, что вибрация работает.
    if (next) window.setTimeout(() => haptic.select(), 0);
  };

  const toggleReduceMotion = () => {
    haptic.select();
    void update((p) => ({ ...p, settings: { ...p.settings, reduceMotion: !p.settings.reduceMotion } }));
  };

  const hapticsHint = !env.ready
    ? undefined
    : !env.inTelegram
      ? "Работает только в Telegram"
      : !env.hapticsAvailable
        ? "Не поддерживается этой версией Telegram"
        : undefined;

  const telegramInfo = !env.ready
    ? "…"
    : env.inTelegram
      ? [env.version && `версия ${env.version}`, env.platform && (PLATFORM_NAMES[env.platform] ?? env.platform)]
          .filter(Boolean)
          .join(", ")
      : "Не используется";

  return (
    <Screen>
      <UserCard />

      <Section header="Занятия">
        <Cell href="/profile/goal" icon="target" iconTone="blue" title="Дневная цель" after={questions(dailyGoal)} />
        <Cell
          icon="flame"
          iconTone="orange"
          title="Серия"
          after={ready ? days(streak) : "…"}
          subtitle={ready && profile.streak.best > 0 ? `Рекорд: ${days(profile.streak.best)}` : undefined}
        />
      </Section>

      <Section
        header="Настройки"
        footer={saveError ? <span className="text-error">Не удалось сохранить изменения. Проверьте интернет и попробуйте ещё раз.</span> : undefined}
      >
        <Cell
          role="switch"
          selected={haptics}
          disabled={Boolean(hapticsHint)}
          onClick={toggleHaptics}
          icon="vibration"
          iconTone="violet"
          title="Вибрация"
          subtitle={hapticsHint}
          after={<Switch checked={haptics && !hapticsHint} disabled={Boolean(hapticsHint)} />}
        />
        <Cell
          role="switch"
          selected={reduceMotion}
          onClick={toggleReduceMotion}
          icon="motion"
          iconTone="teal"
          title="Меньше анимации"
          subtitle="Без сдвигов и пружин, только плавное появление"
          after={<Switch checked={reduceMotion} />}
        />
      </Section>

      <Section
        header="О приложении"
        footer="Бесплатно, без регистрации и рекламы. Прогресс хранится в облаке Telegram в вашем аккаунте: своего сервера у приложения нет."
      >
        <Cell icon="tag" iconTone="gray" title="Версия" after={APP_VERSION} />
        <Cell icon="phone" iconTone="gray" title="Telegram" after={telegramInfo} />
        <Cell
          icon="cloud"
          iconTone="gray"
          title="Прогресс"
          after={!env.ready ? "…" : env.cloudStorageAvailable ? "В облаке Telegram" : "В этом браузере"}
        />
      </Section>
    </Screen>
  );
}
