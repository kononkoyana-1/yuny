/**
 * Билет задания: что сервер показал пользователю — слово, навык, варианты,
 * правильный ответ, — подписанное HMAC. Выдаёт сборщик сессии (#63),
 * принимает `review-submit` (#61).
 *
 * Ключ ответа клиенту виден (он показывает итог сразу — решение владельца в
 * #61), но подменить его нельзя: сервер верит только подписанному билету, а
 * не тому, что клиент говорит о задании. Состояния на сервере нет — билет
 * несёт всё сам.
 */
import type { ExerciseCode } from "./config.ts";
import type { OptionMeta, WordKey } from "./classify.ts";

export type TicketExercise = ExerciseCode | "intro";

export interface Ticket {
  v: 1;
  /** Чей билет: чужой не принимается. */
  uid: string;
  session_id: string;
  exercise: TicketExercise;
  /** Слово задания; у задания на пару — сторона, которая правильный ответ. */
  lexeme_id: string | null;
  /** Задание на пару (X*) или блок различения. */
  pair_id: string | null;
  target: WordKey;
  options?: OptionMeta[];
  expected_orders?: string[][];
  /** C2: тексты плиток в порядке показа; `tile_ids` ответа — `t0`, `t1`… — номера в нём. */
  tiles?: string[];
  /** C1, C2: предложение из кэша `context_sentences` (#64). */
  context_id?: string;
  /** Правильный ответ, как его показать и записать в журнал. */
  expected: string;
  /** Что было на экране: вопрос, предложение, подсказки — в журнал как есть. */
  prompt?: Record<string, unknown>;
  /**
   * Повтор после ошибки внутри сессии: ответ пишется в журнал, но в
   * расписание идёт первая оценка (vocabulary-engine.md, раздел 3, шаг 6).
   */
  retry?: boolean;
  /**
   * Трудная проверка после «Уже знаю»: прошёл — навык стартует со
   * стабильностью ~7 дней; не прошёл — память не трогаем, идёт обычное
   * знакомство.
   */
  check?: "known";
  /** Годен до, мс с эпохи. */
  exp: number;
}

/** Сколько живёт билет: сессия с паузами, но не вчерашняя. */
export const TICKET_TTL_MS = 12 * 3_600_000;

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(text: string): Uint8Array<ArrayBuffer> {
  const s = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

/** Ключ отдельный от прочих применений секрета: префикс домена. */
function key(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(`yuny.learning.ticket:${secret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signTicket(ticket: Ticket, secret: string): Promise<string> {
  const body = b64url(enc.encode(JSON.stringify(ticket)));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await key(secret), enc.encode(body)));
  return `${body}.${b64url(sig)}`;
}

export type TicketError = "ticket_invalid" | "ticket_expired" | "ticket_foreign";

/** Проверенный билет или код ошибки. */
export async function verifyTicket(
  token: string,
  secret: string,
  uid: string,
  now: Date,
): Promise<Ticket | TicketError> {
  const [body, sig, extra] = token.split(".");
  if (!body || !sig || extra !== undefined) return "ticket_invalid";
  let ok = false;
  try {
    ok = await crypto.subtle.verify("HMAC", await key(secret), fromB64url(sig), enc.encode(body));
  } catch {
    return "ticket_invalid";
  }
  if (!ok) return "ticket_invalid";
  let ticket: Ticket;
  try {
    ticket = JSON.parse(new TextDecoder().decode(fromB64url(body)));
  } catch {
    return "ticket_invalid";
  }
  if (ticket.v !== 1) return "ticket_invalid";
  if (ticket.uid !== uid) return "ticket_foreign";
  if (ticket.exp < now.getTime()) return "ticket_expired";
  return ticket;
}
