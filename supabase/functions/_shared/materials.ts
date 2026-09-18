/**
 * Файлы материала: лимиты TZ.md §6 и то, что с файлом надо сделать, прежде
 * чем он попадёт в Gemini.
 *
 * Здесь нет ни базы, ни сети — только решения о байтах, поэтому всё это
 * покрыто тестами в `materials_test.ts`.
 *
 * Лимиты — копия `MATERIAL_LIMITS` из `packages/shared/schemas/module.ts`:
 * Edge Functions этот пакет не импортируют. Клиент проверяет их до отправки,
 * чтобы сказать по-человечески; сервер — заново, потому что клиенту верить
 * нельзя. Менять обе копии сразу.
 */
import { unzipSync } from "npm:fflate@0.8.2";

const MB = 1024 * 1024;

export const LIMITS = {
  maxFiles: 3,
  maxTotalBytes: 30 * MB,
  imageMaxBytes: 10 * MB,
  pdfMaxBytes: 20 * MB,
  pdfMaxPages: 20,
  docxMaxBytes: 5 * MB,
} as const;

export type MaterialKind = "image" | "pdf" | "docx";

const MIME_KINDS: Record<string, MaterialKind> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/heic": "image",
  "image/heif": "image",
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

export function materialKind(mimeType: string): MaterialKind | null {
  return MIME_KINDS[mimeType] ?? null;
}

const MAX_BYTES: Record<MaterialKind, number> = {
  image: LIMITS.imageMaxBytes,
  pdf: LIMITS.pdfMaxBytes,
  docx: LIMITS.docxMaxBytes,
};

export interface StoredFile {
  path: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Проверка набора файлов по лимитам. Возвращает код ошибки для клиента или
 * `null`, если всё в порядке. Размер и тип здесь — те, что сообщил Storage,
 * а не клиент.
 */
export function checkLimits(files: StoredFile[]): string | null {
  if (files.length === 0 || files.length > LIMITS.maxFiles) return "too_many_files";

  let total = 0;
  for (const file of files) {
    const kind = materialKind(file.mimeType);
    if (!kind) return "unsupported_type";
    if (file.sizeBytes > MAX_BYTES[kind]) return "file_too_large";
    total += file.sizeBytes;
  }
  return total > LIMITS.maxTotalBytes ? "total_too_large" : null;
}

/**
 * Число страниц PDF без библиотеки: каждая страница — объект `/Type /Page`,
 * а `/Type /Pages` — узел дерева страниц, его не считаем.
 *
 * Это оценка, а не разбор. У PDF со сжатыми потоками объектов (PDF 1.5+)
 * словари страниц лежат внутри сжатых потоков, и регулярка их не видит, —
 * тогда вернётся 0, и лимит не сработает. Это осознанно: пропустить
 * длинный PDF дешевле, чем отказать короткому. Страниц сверх лимита Gemini
 * всё равно не разберёт хорошо, но и не сломается.
 */
export function pdfPageCount(bytes: Uint8Array): number {
  // latin1 сохраняет байты один к одному — для поиска ASCII-маркеров это то,
  // что нужно, а бинарные потоки просто не совпадут.
  const text = new TextDecoder("latin1").decode(bytes);
  return (text.match(/\/Type\s*\/Page(?![a-zA-Z])/g) ?? []).length;
}

/**
 * Текст из DOCX. Gemini этот формат не принимает (только PDF, картинки и
 * текст), поэтому DOCX уходит в разбор текстом. Картинки внутри документа при
 * этом теряются — для страницы с заданиями это приемлемо, для скана внутри
 * DOCX нет, но такой скан человек и так загрузит фотографией.
 *
 * Возвращает `null`, если файл не открылся как DOCX.
 */
export function docxText(bytes: Uint8Array): string | null {
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(bytes, { filter: (file) => file.name === "word/document.xml" });
  } catch {
    return null;
  }
  const xml = entries["word/document.xml"];
  if (!xml) return null;

  const text = new TextDecoder("utf-8")
    .decode(xml)
    // Конец абзаца и разрыв строки — перевод строки; табуляция — табуляция.
    .replace(/<\/w:p>/g, "\n")
    .replace(/<w:br[^>]*\/>/g, "\n")
    .replace(/<w:tab[^>]*\/>/g, "\t")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}

/**
 * Лимит на инлайн-данные у Gemini считается на весь запрос после base64, а
 * base64 раздувает байты на треть. Держим запас: всё, что не влезает в этот
 * бюджет, уходит через Files API.
 */
export const INLINE_BUDGET_BYTES = 14 * MB;

/**
 * Какие файлы отправить инлайн, а какие загрузить отдельно. Инлайн идут самые
 * маленькие, пока влезают в бюджет: так больше файлов обходится без лишнего
 * запроса к Files API.
 */
export function splitInline<T extends { bytes: Uint8Array }>(
  files: T[],
  budget = INLINE_BUDGET_BYTES,
): { inline: T[]; upload: T[] } {
  const bySize = [...files].sort((a, b) => a.bytes.byteLength - b.bytes.byteLength);
  const inline: T[] = [];
  const upload: T[] = [];
  let used = 0;
  for (const file of bySize) {
    const encoded = Math.ceil(file.bytes.byteLength / 3) * 4;
    if (used + encoded <= budget) {
      inline.push(file);
      used += encoded;
    } else {
      upload.push(file);
    }
  }
  return { inline, upload };
}
