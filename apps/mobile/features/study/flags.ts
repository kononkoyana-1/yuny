import { DATA_SOURCE } from "@/shared/config/dataSource";

/**
 * Карточка «Сегодня» над словарём (#66). Экрана занятия ещё нет (#67, #68),
 * а «Начать» без него вести некуда — поэтому на настоящем бэкенде карточка
 * включается явно (`EXPO_PUBLIC_TODAY=1`), в mock-режиме видна всегда.
 * Флаг уходит вместе с #68.
 */
export const TODAY_ENABLED = DATA_SOURCE === "mock" || process.env.EXPO_PUBLIC_TODAY === "1";
