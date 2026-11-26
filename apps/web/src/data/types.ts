export type QuestionFormat = "yn" | "mc" | "wr";

interface QuestionBase {
  /** Номер из таблицы: по нему хранится прогресс. */
  id: number;
  /** Колода (документ). */
  d: string;
  /** Тема. */
  t: string;
  /** Текст вопроса или утверждения. */
  q: string;
  /** Пояснение после ответа. */
  x: string;
  /** Сложность 1–3. */
  l: number;
  /** Проверено юристом. */
  ok?: 1;
}

export interface YesNoQuestion extends QuestionBase {
  f: "yn";
  a: "Да" | "Нет";
}

export interface ChoiceQuestion extends QuestionBase {
  f: "mc";
  o: [string, string, string, string];
  a: number;
}

export interface WrittenQuestion extends QuestionBase {
  f: "wr";
  a: string;
  acc: string[];
}

export type Question = YesNoQuestion | ChoiceQuestion | WrittenQuestion;

export interface DeckGroup {
  id: string;
  title: string;
}

export interface Deck {
  id: string;
  title: string;
  group: string;
  /** Документ в родительном падеже: «Устава Профсоюза». */
  source: string;
  count: number;
}

export interface PuzzleSwatch {
  hex: string;
  name?: string;
}

export interface PuzzleCalendar {
  year: number;
  /** 1–12 */
  month: number;
  marks: number[];
}

export interface PuzzleAudio {
  src: string;
  /** Проиграть задом наперёд. */
  reverse?: boolean;
  /** Откуда и докуда играть, в секундах. */
  start?: number;
  end?: number;
}

export interface PuzzleItem {
  id: string;
  prompt: string;
  /** Картинка с заданием (путь внутри public/). */
  image?: string;
  /** Картинка, которую показываем вместе с ответом. */
  answerImage?: string;
  /** Текст задания: цитата, анкета, список. */
  text?: string;
  /** Ребус из символов и эмодзи, показывается крупно. */
  rebus?: string;
  /** Последовательность нажатий на кнопочном телефоне. */
  t9?: string;
  swatches?: PuzzleSwatch[];
  calendar?: PuzzleCalendar;
  audio?: PuzzleAudio;
  hint?: string;
  answer: string;
  /** Пояснение к ответу. */
  note?: string;
}

export interface PuzzleSet {
  id: string;
  title: string;
  subtitle?: string;
  order?: number;
  items: PuzzleItem[];
}
