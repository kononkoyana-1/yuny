import { DATA_SOURCE } from "@/shared/config/dataSource";

/**
 * Карточка «Сегодня» над словарём (#66). Занятие (#67) уже есть, но без окна
 * «Повторим?» и итога дня (#68) оно не закончено — поэтому на настоящем бэкенде карточка
 * включается явно (`EXPO_PUBLIC_TODAY=1`), в mock-режиме видна всегда.
 * Флаг уходит вместе с #68.
 */
export const TODAY_ENABLED = DATA_SOURCE === "mock" || process.env.EXPO_PUBLIC_TODAY === "1";
