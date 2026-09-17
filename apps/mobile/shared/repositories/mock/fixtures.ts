import type { Profile } from "@yuny/shared";

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
