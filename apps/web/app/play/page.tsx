import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { Section } from "@/components/ui/Section";

const PUZZLES = [
  { title: "Собери норму", text: "Расставьте части статьи в правильном порядке." },
  { title: "Найди пару", text: "Соедините термин с определением или орган с полномочием." },
  { title: "По порядку", text: "Восстановите последовательность процедуры." },
  { title: "Разложи по группам", text: "Распределите права и обязанности по участникам." },
  { title: "Дело дня", text: "Одна ситуация в день: разберитесь, кто прав и почему." },
];

export default function PlayPage() {
  return (
    <Screen title="Играть">
      <Section padded>
        <EmptyState icon="puzzle" title="Головоломки в работе">
          Они появятся вместе с первыми вопросами: каждая головоломка собирается из тех же проверенных норм.
        </EmptyState>
      </Section>

      <Section header="Что готовим">
        {PUZZLES.map((puzzle) => (
          <div key={puzzle.title} className="px-4 py-3">
            <p className="text-[16px] font-medium text-fg">{puzzle.title}</p>
            <p className="mt-0.5 text-[14px] leading-snug text-hint">{puzzle.text}</p>
          </div>
        ))}
      </Section>
    </Screen>
  );
}
