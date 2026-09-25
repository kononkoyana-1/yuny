/**
 * Источники данных для раздела «О приложении» (settings.design.md §3.6).
 * Лицензии части источников требуют указать их в приложении (#74, #78):
 * подключили источник — добавили строку сюда и два ключа
 * `settings.about.source.<id>.*` в ru.ts.
 */
export interface DataSource {
  id: "bkrs" | "hsk2" | "makemeahanzi" | "cc-cedict" | "tatoeba";
  /** `null` — строка не ссылка (у списков HSK 2.0 нет общего публичного адреса). */
  url: string | null;
}

export const DATA_SOURCES: DataSource[] = [
  { id: "bkrs", url: "https://bkrs.info" },
  { id: "hsk2", url: null },
  { id: "makemeahanzi", url: "https://github.com/skishore/makemeahanzi" },
];
