import { z } from "zod";

/**
 * Загрузка материала и его разбор в модуль (TZ.md §6, §7, §13).
 *
 * Лимиты живут здесь, чтобы экран загрузки проверял их до отправки и говорил
 * человеческим языком, а не пересказывал отказ сервера. Сервер проверяет их
 * заново: клиенту верить нельзя. Edge Functions не импортируют этот пакет,
 * поэтому у `module-create` своя копия тех же чисел — менять обе сразу.
 */
const MB = 1024 * 1024;

export const MATERIAL_LIMITS = {
  maxFiles: 3,
  maxTotalBytes: 30 * MB,
  /** Фото сжимается на клиенте до этой длины по длинной стороне. */
  imageMaxSide: 2048,
  imageMaxBytes: 10 * MB,
  pdfMaxBytes: 20 * MB,
  pdfMaxPages: 20,
  docxMaxBytes: 5 * MB,
} as const;

export const MATERIAL_MIME_TYPES = {
  image: ["image/jpeg", "image/png", "image/heic", "image/heif"],
  pdf: ["application/pdf"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
} as const;

export type MaterialKind = keyof typeof MATERIAL_MIME_TYPES;

export function materialKind(mimeType: string): MaterialKind | null {
  for (const [kind, types] of Object.entries(MATERIAL_MIME_TYPES)) {
    if ((types as readonly string[]).includes(mimeType)) return kind as MaterialKind;
  }
  return null;
}

/**
 * Один загруженный файл. Путь — `{user_id}/{material_id}/{filename}` в bucket
 * `materials`; размер сервер всё равно берёт из Storage, а не отсюда.
 */
export const MaterialFileSchema = z.object({
  path: z.string().min(1),
  filename: z.string().min(1).max(200),
  mime_type: z.string().min(1),
  size_bytes: z.number().int().positive(),
});

export const ModuleCreateRequestSchema = z.object({
  /** Папка загрузки: все файлы одного модуля лежат под одним `material_id`. */
  material_id: z.uuid(),
  files: z.array(MaterialFileSchema).min(1).max(MATERIAL_LIMITS.maxFiles),
});

/** Ответ `module-create`: задача разбора и модуль, куда она его сложит. */
export const ModuleCreateResponseSchema = z.object({
  job_id: z.uuid(),
  kind: z.literal("module_parse"),
  module_id: z.uuid(),
});

/** Повторный разбор модуля, чей прошлый разбор упал не по вине материала. */
export const ModuleParseRequestSchema = z.object({
  module_id: z.uuid(),
});

/** Что кладёт в `jobs.result` удачный разбор. */
export const ModuleParseResultSchema = z.object({
  module_id: z.uuid(),
  vocabulary_count: z.number().int().min(0),
  grammar_count: z.number().int().min(0),
});

/**
 * Коды ошибок, которые сервер отдаёт в загрузке и разборе. Клиент превращает
 * их в текст, техническая причина до экрана не доходит (TZ.md §11). Что с
 * каким кодом делать — таблица в docs/design/specs/upload.design.md §2.
 *
 * Что после кода остаётся на сервере:
 *   * `module-create` отказал по лимитам (`too_many_files`, `total_too_large`,
 *     `file_too_large`, `unsupported_type`, `file_missing`) — модуля нет,
 *     файлы загрузки удалены;
 *   * разбор отверг материал (`not_language_material`, `pdf_too_many_pages`) —
 *     модуль и файлы удалены, повторять нечего, нужен другой файл;
 *   * разбор упал (`ai_unavailable`, `ai_invalid_response`, `internal_error`) —
 *     модуль в статусе `failed` с файлами, `module-parse` разберёт его заново;
 *   * разбор не нашёл файл в Storage (`file_missing` из задачи) — модуль в
 *     `failed`, но повтор не поможет: файлов нет;
 *   * `module-parse` отказал (`module_not_found`, `module_not_retryable`) —
 *     модуля нет или он не в `failed`.
 *
 * Сверх этого списка клиент видит свои коды из `BackendError`: `network_error`,
 * `empty_response`, `timeout`, `realtime_unavailable`, `unauthorized`.
 */
export const ModuleErrorCodeSchema = z.enum([
  "invalid_request",
  "too_many_files",
  "total_too_large",
  "file_too_large",
  "unsupported_type",
  "file_missing",
  "storage_unavailable",
  "module_create_failed",
  "job_create_failed",
  "pdf_too_many_pages",
  "not_language_material",
  "module_not_found",
  "module_not_retryable",
  "ai_unavailable",
  "ai_invalid_response",
  "internal_error",
]);

export type MaterialFile = z.infer<typeof MaterialFileSchema>;
export type ModuleCreateRequest = z.infer<typeof ModuleCreateRequestSchema>;
export type ModuleCreateResponse = z.infer<typeof ModuleCreateResponseSchema>;
export type ModuleParseRequest = z.infer<typeof ModuleParseRequestSchema>;
export type ModuleParseResult = z.infer<typeof ModuleParseResultSchema>;
export type ModuleErrorCode = z.infer<typeof ModuleErrorCodeSchema>;

/**
 * Модуль на Главной — строка представления `public.module_progress` (TZ.md
 * §10, §11 экран 01). Прогресс считает сервер: пройдено заданий (`done_tasks`)
 * из всех в текущем комплекте (`total_tasks`). На Главной только готовые
 * модули.
 */
export const ModuleProgressSchema = z.object({
  module_id: z.uuid(),
  title: z.string(),
  topic: z.string().nullable(),
  created_at: z.iso.datetime({ offset: true }),
  /** Номер текущего комплекта заданий (TZ.md §10, «Сформировать новые задания»). */
  generation: z.number().int().min(1),
  total_tasks: z.number().int().min(0),
  done_tasks: z.number().int().min(0),
});

export type ModuleProgress = z.infer<typeof ModuleProgressSchema>;
