/**
 * Данные о знаках (#74) из `hanzi_chars` — для карточки пары и стартовой
 * сложности. Таблицы нет или запрос упал — пустой словарь: строка разбора
 * просто не покажется, задание собирается как раньше.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.112.4";
import { type HanziChar, type HanziMap, readHanzi } from "./learning/mod.ts";

/** Строки для всех знаков из `headwords`. */
export async function loadHanzi(admin: SupabaseClient, headwords: string[]): Promise<HanziMap> {
  const chars = [...new Set(headwords.flatMap((h) => [...h]))];
  const out = new Map<string, HanziChar>();
  if (!chars.length) return out;
  const { data, error } = await admin.from("hanzi_chars").select("*").in("character", chars);
  if (error) {
    console.warn("hanzi_load_failed", error.message);
    return out;
  }
  for (const row of data ?? []) {
    const c = readHanzi(row);
    if (c) out.set(c.character, c);
  }
  return out;
}
