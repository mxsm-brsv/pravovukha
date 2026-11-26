import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";

export default function NotFound() {
  return (
    <Screen>
      <EmptyState
        icon="info"
        title="Такой страницы нет"
        action={
          <Link href="/" className="inline-flex h-11 items-center rounded-xl bg-button px-5 font-semibold text-button-fg">
            На главную
          </Link>
        }
      >
        Возможно, ссылка устарела после обновления приложения.
      </EmptyState>
    </Screen>
  );
}
