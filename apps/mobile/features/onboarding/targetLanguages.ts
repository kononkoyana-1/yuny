/**
 * Screen 02 (Target Language) list. MVP Spec §5: "количество языков может
 * быть ограничено" — the list itself may be short, but nothing here or in
 * `language.tsx` assumes a fixed length; adding a language is a one-line
 * addition to this array, no code change (TZ.md §15 — target-language UI
 * "должны быть расширяемыми без переписывания").
 *
 * English only for MVP. German/Spanish/French were offered here while every
 * piece of content in the pipeline was English — the picker promised courses
 * that could not be built. They come back when there is content behind them;
 * the extensibility above is what makes that a one-line change.
 */
export interface TargetLanguageOption {
  code: string;
  label: string;
}

export const TARGET_LANGUAGES: TargetLanguageOption[] = [
  { code: "en", label: "English" },
];
