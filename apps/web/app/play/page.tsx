"use client";

import { useEffect } from "react";
import { Cell } from "@/components/ui/Cell";
import { LoadError, Loading } from "@/components/ui/Loading";
import { Ring } from "@/components/ui/Ring";
import { Screen } from "@/components/ui/Screen";
import { Section } from "@/components/ui/Section";
import { useContent } from "@/data/content";
import { useLoadedContent } from "@/data/hooks";
import { plural } from "@/lib/plural";
import { useGames } from "@/stores/games";

export default function PlayPage() {
  const status = useLoadedContent();
  const puzzles = useContent((s) => s.puzzles);
  const error = useContent((s) => s.error);
  const games = useGames((s) => s.data);
  const loadGames = useGames((s) => s.load);
  useEffect(() => {
    void loadGames();
  }, [loadGames]);

  if (status === "error") return <Screen title="Играть"><LoadError message={error} /></Screen>;
  if (status !== "ready") return <Screen title="Играть"><Loading /></Screen>;

  return (
    <Screen title="Играть" subtitle="Режимы как на конкурсе «Ты — лидер» и головоломки с прошлых конкурсов.">
      <Section header="Правовые бои" footer="Вопросы из банка «Правовухи». Рекорды сохраняются в вашем аккаунте Telegram.">
        <Cell
          href="/play/two-one"
          icon="duel"
          iconTone="violet"
          title="2 к 1"
          subtitle="Пять права на ошибку, после шестой — вылет"
          after={games.twoToOne > 0 ? `${games.twoToOne}` : undefined}
        />
        <Cell
          href="/play/biathlon"
          icon="target2"
          iconTone="teal"
          title="Правовой биатлон"
          subtitle="Отвечайте быстро: одна ошибка — и вы выбыли"
          after={games.biathlon > 0 ? `${games.biathlon}` : undefined}
        />
      </Section>

      <Section header="Головоломки" footer="Ребусы, логотипы, люди, даты, шифры и звуки. Ответ проверяете сами: подумайте и откройте его.">
        {puzzles.map((set) => {
          const solved = games.puzzles[set.id]?.length ?? 0;
          return (
            <Cell
              key={set.id}
              href={`/play/puzzles?set=${set.id}`}
              icon={set.id === "new" ? "bulb" : "puzzle"}
              iconTone={set.id === "new" ? "orange" : "blue"}
              title={set.title}
              subtitle={`${plural(set.items.length, "головоломка", "головоломки", "головоломок")}${solved ? ` · отгадано ${solved}` : ""}`}
              after={solved ? <Ring value={solved / set.items.length} /> : undefined}
            />
          );
        })}
      </Section>
    </Screen>
  );
}
