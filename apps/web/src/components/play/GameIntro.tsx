import type { ReactNode } from "react";
import { Section } from "../ui/Section";

/** Правила режима перед началом игры. */
export function GameIntro({ rules, best, children }: { rules: string[]; best: number; children?: ReactNode }) {
  return (
    <>
      <Section header="Правила">
        {rules.map((rule) => (
          <p key={rule} className="px-4 py-3 text-[16px] leading-snug text-fg">
            {rule}
          </p>
        ))}
      </Section>
      {best > 0 && (
        <Section padded>
          <p className="text-[16px] text-fg">
            Ваш рекорд: <span className="font-semibold tabular-nums">{best}</span>
          </p>
        </Section>
      )}
      {children}
    </>
  );
}
