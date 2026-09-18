import { Image } from "react-native";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { MATERIAL_LIMITS, MATERIAL_MIME_TYPES, materialKind, type MaterialKind } from "@yuny/shared";
import { t } from "@/shared/i18n";
import { formatFileSize } from "./format";
import type { RawAsset } from "./sources";

export interface SelectedFile {
  id: string;
  kind: MaterialKind;
  /** Local URI — the compressed JPEG's cache path for a photo, the picker's own URI otherwise. */
  uri: string;
  mimeType: string;
  extension: string;
  /** PDF/DOCX: the picker's own name. Photos: `null` — their display name is computed from position (see `displayName`). */
  originalName: string | null;
  /** Final byte size — post-compression for a photo. `0` while `preparing`. */
  sizeBytes: number;
  /** True only while a photo is still being resized/re-encoded. */
  preparing: boolean;
}

export interface BannerMessage {
  key: string;
  params?: Record<string, unknown>;
}

export interface AddFilesCallbacks {
  /** A row should appear now — either finished (PDF/DOCX) or `preparing` (photo). */
  onAdd(file: SelectedFile): void;
  /** A `preparing` row finished compressing and passed its checks. */
  onUpdate(id: string, patch: Partial<SelectedFile>): void;
  /** A row failed a check only resolvable after it was added (photo size, post-compression total). */
  onRemove(id: string): void;
  /**
   * The live list at the moment of the call — not a snapshot taken when the
   * batch started. A photo's compression is async, so by the time its size
   * is known, a sibling pick (e.g. a document added from a second, faster
   * source) may already be in the store; the running-total check (§3 point
   * 5) has to see that (design review round 2, m6).
   */
  getFiles(): SelectedFile[];
}

/** 1-based position among photos only — PDFs/DOCXs interleaved in the list do not affect the count. */
export function photoNumber(files: SelectedFile[], id: string): number {
  return files.filter((f) => f.kind === "image").findIndex((f) => f.id === id) + 1;
}

/**
 * The name shown in the row AND sent as `filename` in the `module-create`
 * request (design spec §3: "это же имя уходит в filename"). Computed from
 * the file's current position rather than stored, so it stays correct after
 * a sibling photo is removed and the numbering shifts.
 */
export function displayNameFor(files: SelectedFile[], file: SelectedFile): string {
  if (file.kind === "image") {
    return t("upload.file.photoName", { n: photoNumber(files, file.id) });
  }
  return file.originalName ?? "";
}

/** Row meta line: `upload.file.preparing` while compressing, else `upload.file.meta`. */
export function metaFor(file: SelectedFile): string {
  if (file.preparing) return t("upload.file.preparing");
  return t("upload.file.meta", {
    kind: t(`upload.file.kind.${file.kind}`),
    size: formatFileSize(file.sizeBytes),
  });
}

function totalBytes(files: SelectedFile[]): number {
  return files.reduce((sum, f) => sum + f.sizeBytes, 0);
}

/**
 * The picker's own name, or `upload.file.unnamed` when it gave none (or an
 * empty string) — never the URI (design spec §3 "Отображаемое имя", v1.1).
 * This is the name used everywhere a file is named: the row, `upload.error.*`
 * banners' `{{name}}`, `upload.file.remove`, and the `filename` sent to the
 * server.
 */
function resolveName(asset: RawAsset): string {
  return asset.name && asset.name.trim() !== "" ? asset.name : t("upload.file.unnamed");
}

/**
 * MIME from the picker when it gave one; falls back to sniffing the
 * extension when it did not (empty or `application/octet-stream`) — §3
 * point 2. `null` means "not a type this product accepts".
 */
function resolveMimeType(asset: RawAsset): string | null {
  if (asset.mimeType && asset.mimeType !== "application/octet-stream") return asset.mimeType;

  // Extension sniffing only, never a display name — the URI is a fine
  // fallback here even though it never is for what the user sees.
  const source = asset.name || asset.uri;
  const ext = source.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return MATERIAL_MIME_TYPES.pdf[0];
    case "docx":
      return MATERIAL_MIME_TYPES.docx[0];
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "heic":
      return "image/heic";
    case "heif":
      return "image/heif";
    default:
      return null;
  }
}

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

/** Bytes of a local `file://`/blob URI — the only cross-platform way to size a file without `expo-file-system` (design spec P3). */
async function readByteLength(uri: string): Promise<number> {
  const response = await fetch(uri);
  const buffer = await response.arrayBuffer();
  return buffer.byteLength;
}

/**
 * Resizes to `MATERIAL_LIMITS.imageMaxSide` on the longer side (only ever
 * shrinking — the context API applies no resize action when the source is
 * already smaller) and always re-encodes to JPEG at quality 0.8, per §3
 * point 3.
 */
async function compressImage(uri: string): Promise<{ uri: string; sizeBytes: number }> {
  const { width, height } = await getImageSize(uri);
  const context = ImageManipulator.manipulate(uri);

  if (Math.max(width, height) > MATERIAL_LIMITS.imageMaxSide) {
    if (width >= height) {
      context.resize({ width: MATERIAL_LIMITS.imageMaxSide });
    } else {
      context.resize({ height: MATERIAL_LIMITS.imageMaxSide });
    }
  }

  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
  const sizeBytes = await readByteLength(saved.uri);
  return { uri: saved.uri, sizeBytes };
}

/**
 * Runs §3's per-batch pipeline — slots, then per file: type, compression
 * (photos only), size, running total — mutating the list through
 * `callbacks` as each row resolves. Returns the single banner to show
 * (spec: "одно сообщение за раз — последнее"): whichever check failed last,
 * or `undefined` if the whole batch was accepted.
 */
export async function addPickedAssets(
  assets: RawAsset[],
  existingFiles: SelectedFile[],
  callbacks: AddFilesCallbacks,
  makeId: () => string,
): Promise<BannerMessage | undefined> {
  let banner: BannerMessage | undefined;
  const remaining = Math.max(0, MATERIAL_LIMITS.maxFiles - existingFiles.length);
  const taken = assets.slice(0, remaining);
  if (assets.length > taken.length) {
    banner = { key: "upload.error.tooMany" };
  }

  for (const asset of taken) {
    const mimeType = resolveMimeType(asset);
    const kind = mimeType ? materialKind(mimeType) : null;
    if (!mimeType || !kind) {
      banner = { key: "upload.error.unsupported", params: { name: resolveName(asset) } };
      continue;
    }

    if (kind === "image") {
      const id = makeId();
      const placeholder: SelectedFile = {
        id,
        kind,
        uri: asset.uri,
        mimeType: "image/jpeg",
        extension: "jpg",
        originalName: null,
        sizeBytes: 0,
        preparing: true,
      };
      callbacks.onAdd(placeholder);

      let compressed: { uri: string; sizeBytes: number };
      try {
        compressed = await compressImage(asset.uri);
      } catch {
        callbacks.onRemove(id);
        banner = { key: "upload.error.imageUnreadable" };
        continue;
      }

      if (compressed.sizeBytes > MATERIAL_LIMITS.imageMaxBytes) {
        callbacks.onRemove(id);
        banner = { key: "upload.error.imageTooLarge" };
        continue;
      }

      // The live list at this instant, not the batch's opening snapshot: a
      // sibling file may have been added by another in-flight pick while
      // this photo was compressing (§3 point 5; design review round 2, m6).
      // The placeholder is already in it at `sizeBytes: 0`, so adding the
      // compressed size is all that's needed.
      const candidateTotal = totalBytes(callbacks.getFiles()) + compressed.sizeBytes;
      if (candidateTotal > MATERIAL_LIMITS.maxTotalBytes) {
        callbacks.onRemove(id);
        banner = { key: "upload.error.totalTooLarge" };
        continue;
      }

      callbacks.onUpdate(id, { uri: compressed.uri, sizeBytes: compressed.sizeBytes, preparing: false });
      continue;
    }

    // PDF / DOCX.
    let sizeBytes = asset.size;
    if (sizeBytes == null) {
      try {
        sizeBytes = await readByteLength(asset.uri);
      } catch {
        // Extremely rare (`DocumentPickerAsset.size` is virtually always
        // present). `upload.error.unsupported` would be false here — the
        // type is fine, the bytes just didn't read — so this uses the
        // dedicated `unreadable` copy instead (design review round 2,
        // owner decision 3).
        banner = { key: "upload.error.unreadable", params: { name: resolveName(asset) } };
        continue;
      }
    }

    const limit = kind === "pdf" ? MATERIAL_LIMITS.pdfMaxBytes : MATERIAL_LIMITS.docxMaxBytes;
    const name = resolveName(asset);
    if (sizeBytes > limit) {
      banner = {
        key: kind === "pdf" ? "upload.error.pdfTooLarge" : "upload.error.docxTooLarge",
        params: { name },
      };
      continue;
    }

    // Live list, same reasoning as the photo branch above (m6).
    if (totalBytes(callbacks.getFiles()) + sizeBytes > MATERIAL_LIMITS.maxTotalBytes) {
      banner = { key: "upload.error.totalTooLarge" };
      continue;
    }

    const file: SelectedFile = {
      id: makeId(),
      kind,
      uri: asset.uri,
      mimeType,
      extension: kind,
      originalName: name,
      sizeBytes,
      preparing: false,
    };
    callbacks.onAdd(file);
  }

  return banner;
}
