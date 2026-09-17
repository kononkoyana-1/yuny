import { z } from "zod";

/** HSK 2.0: шесть уровней, 5000 слов (TZ.md §4). */
export const HskLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

/**
 * Таблица `profiles` (TZ.md §12). Клиент читает и обновляет только свою
 * строку. Языковая пара зафиксирована — китайский из русского, — поэтому
 * полей языка здесь нет: выбирать нечего.
 *
 * `hsk_level` появится здесь вместе со своей миграцией
 * (`20260917120000_reset_to_material_modules.sql`, фаза 1). Схема описывает
 * то, что в таблице есть сегодня, а не то, что задумано.
 */
export const ProfileSchema = z.object({
  id: z.uuid(),
  display_name: z.string().min(1),
  created_at: z.iso.datetime({ offset: true }),
});

export type Profile = z.infer<typeof ProfileSchema>;
export type HskLevel = z.infer<typeof HskLevelSchema>;
