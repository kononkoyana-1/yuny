import * as Crypto from "expo-crypto";

/**
 * UUID v4 из 16 случайных байт.
 *
 * Не `Crypto.randomUUID()`: на web он зовёт `crypto.randomUUID`, а браузер
 * даёт его только в защищённом контексте — HTTPS или `localhost`. Приложение,
 * открытое по IP разработческой машины (`http://172.…`), падало на первом же
 * файле с «randomUUID is not a function». `getRandomBytes` на web — это
 * `crypto.getRandomValues`, который есть и без HTTPS, на iOS и Android —
 * нативный генератор; источник случайности тот же, что у `randomUUID`.
 */
export function uuid(): string {
  const bytes = Crypto.getRandomBytes(16);
  // RFC 4122 §4.4: версия 4 в старшей тетраде 7-го байта, вариант 10xx — в 9-м.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
