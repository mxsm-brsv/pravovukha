import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { Section } from "@/components/ui/Section";

export default function LearnPage() {
  return (
    <Screen title="Учить">
      <Section padded>
        <EmptyState icon="book" title="Колоды скоро появятся">
          Первая колода — вопросы по Уставу Профсоюза. У каждого вопроса будет пояснение со ссылкой на пункт документа.
        </EmptyState>
      </Section>

      <Section header="Как будет устроено" footer="Прогресс сохраняется в вашем аккаунте Telegram и доступен на всех устройствах.">
        <div className="px-4 py-3">
          <p className="text-[16px] font-medium text-fg">Тренировка</p>
          <p className="mt-0.5 text-[14px] leading-snug text-hint">
            Вопросы по одной колоде. После ответа сразу видно пояснение, ошибки попадают в повторение.
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="text-[16px] font-medium text-fg">Карточки</p>
          <p className="mt-0.5 text-[14px] leading-snug text-hint">
            Термин с одной стороны, определение с другой. Свайп вправо — знаю, влево — повторить.
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="text-[16px] font-medium text-fg">Экзамен</p>
          <p className="mt-0.5 text-[14px] leading-snug text-hint">
            20 вопросов за 20 минут, допускается не больше двух ошибок. За каждую ошибку — пять дополнительных вопросов и
            пять минут.
          </p>
        </div>
      </Section>
    </Screen>
  );
}
