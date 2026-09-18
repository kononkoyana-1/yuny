import type { ModuleProgress, Profile } from "@yuny/shared";

/**
 * Моковые данные (TZ.md §13). Один пользователь — этого хватает, чтобы
 * увидеть настройки без бэкенда.
 */
const NOW = new Date().toISOString();

export const MOCK_USER_ID = "b0dc2736-b2d0-4f23-bc95-f8dbcc234c29";

export const mockProfile: Profile = {
  id: MOCK_USER_ID,
  display_name: "Аня",
  created_at: NOW,
};

/**
 * Переключатель пустого списка на Главной (home.design.md §1), по образцу
 * `DATA_SOURCE` в `shared/config/dataSource.ts`: читается один раз из
 * переменной окружения, а не завязан на состояние экрана.
 */
export const MOCK_MODULES_EMPTY = process.env.EXPO_PUBLIC_MOCK_MODULES_EMPTY === "true";

/**
 * Пять фикстур из home.design.md §1, прогнанные через `ModuleProgressSchema`
 * в `mockModuleRepository.listModules()`. Отсортированы по `created_at` по
 * убыванию, как это делает сервер, — (а) новее всех и открывает список.
 */
export const mockModules: ModuleProgress[] = [
  {
    // (а) новый модуль, 0 / 8: только что собран, ещё ничего не пройдено.
    module_id: "9c1b5b3a-2b1a-4e1f-8d3c-000000000001",
    title: "Приветствия и знакомство",
    topic: "Урок 1",
    created_at: "2026-09-18T09:00:00+00:00",
    generation: 1,
    total_tasks: 8,
    done_tasks: 0,
    cover_text: "你",
  },
  {
    // (б) модуль в процессе, 3 / 8.
    module_id: "9c1b5b3a-2b1a-4e1f-8d3c-000000000002",
    title: "Семья и родственники",
    topic: "Урок 2",
    created_at: "2026-09-17T09:00:00+00:00",
    generation: 1,
    total_tasks: 8,
    done_tasks: 3,
    cover_text: "家",
  },
  {
    // (в) пройденный модуль, 8 / 8 — отличие только в полном кольце.
    module_id: "9c1b5b3a-2b1a-4e1f-8d3c-000000000003",
    title: "Числа от одного до ста",
    topic: "Урок 3",
    created_at: "2026-09-16T09:00:00+00:00",
    generation: 1,
    total_tasks: 8,
    done_tasks: 8,
    cover_text: "数",
  },
  {
    // (г) длинное название (60+ символов), topic: null.
    module_id: "9c1b5b3a-2b1a-4e1f-8d3c-000000000004",
    title:
      "Разговор в ресторане: как заказать блюда, попросить счёт и поблагодарить официанта на китайском",
    topic: null,
    created_at: "2026-09-15T09:00:00+00:00",
    generation: 1,
    total_tasks: 12,
    done_tasks: 5,
    cover_text: null,
  },
  {
    // (д) cover_text: null — кружок покажет первую графему title.
    module_id: "9c1b5b3a-2b1a-4e1f-8d3c-000000000005",
    title: "Погода и времена года",
    topic: "Урок 5",
    created_at: "2026-09-14T09:00:00+00:00",
    generation: 1,
    total_tasks: 6,
    done_tasks: 2,
    cover_text: null,
  },
];
