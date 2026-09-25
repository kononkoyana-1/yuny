import type { CharNote } from "@yuny/shared";
import { pinyinWithMarks } from "@/shared/lib/dictionaryText";
import { t } from "@/shared/i18n";

/** Слово пользователя в заметке: знак и чтение со знаками тонов. */
export interface CharNoteWord {
  headword: string;
  reading: string | null;
}

/** Что показывает строка знака в знакомстве (#88). */
export interface CharNoteView {
  char: string;
  reading: string | null;
  meaning: string | null;
  known: CharNoteWord[];
  /** Для диктора — одна фраза на знак. */
  a11y: string;
}

const marked = (reading: string | null) => (reading ? pinyinWithMarks(reading) : null);

/**
 * Строка знака: «服 fú — одежда · уже есть в ваших словах: 衣服 yīfu · 服务 fúwù».
 * Пиньинь — со знаками тонов, даже если пришёл цифрами. Значения нет — его
 * нет ни в строке, ни во фразе для диктора.
 */
export function charNoteView(note: CharNote): CharNoteView {
  const reading = marked(note.reading);
  const known = note.known_in.map((w) => ({ headword: w.headword, reading: marked(w.reading) }));
  const head = [note.char, reading, note.meaning].filter(Boolean).join(", ");
  const status = known.length
    ? t("learn.ex.intro.charKnownA11y", {
        words: known.map((w) => [w.headword, w.reading].filter(Boolean).join(" ")).join(", "),
      })
    : t("learn.ex.intro.charNewA11y");
  return { char: note.char, reading, meaning: note.meaning, known, a11y: `${head}. ${status}` };
}
