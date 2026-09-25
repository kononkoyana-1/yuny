import { create, type StoreApi } from "zustand";
import { uuid } from "@/shared/lib/uuid";
import { MATERIAL_LIMITS, type WordsExtractRequest, type WordsExtractResult } from "@yuny/shared";
import { moduleRepository, wordsRepository } from "@/shared/repositories";
import { BackendError } from "@/shared/lib/backendError";
import { addPickedAssets, displayNameFor, type SelectedFile, type BannerMessage } from "./selection";
import { pickFromCamera, pickFromFiles, pickFromGallery, type PickOutcome } from "./sources";
import { errorRoute, needsFreshMaterialId, type ErrorPhase, type FailureKind } from "./errorRoute";

/**
 * The one state machine for screen 02 + the parse-wait screen (design spec
 * §1): `selecting → sending → reading → success`, with `failed` reachable
 * from `sending`/`reading` per §2's routing table.
 *
 * Since 2026-09-23 the file is read for words only (`words-extract`), not
 * turned into a module: Главная is hidden, and `success` carries the word
 * list the screen offers to save into a folder. Lives in a Zustand store,
 * not component state, on purpose — a user can switch tabs mid-parse and
 * the `awaitParse` promise below keeps running because it belongs to this
 * module, not to a mounted screen's `useEffect` (Acceptance #16).
 */
export type FlowPhase = "selecting" | "sending" | "reading" | "success" | "failed";

export interface UploadFlowState {
  phase: FlowPhase;
  /** Persists across every phase — including `failed` — so "Изменить выбор" / "Выбрать другой файл" always has something to show. */
  files: SelectedFile[];
  materialId: string | null;
  bannerKey?: string;
  bannerParams?: Record<string, unknown>;
  /** True only for the instant between pressing "Создать модуль" and the phase flipping to `sending`. */
  submitting: boolean;
  current: number;
  total: number;
  jobId: string | null;
  /** The `words-extract` request as last sent — a retry resends it without re-uploading. */
  request: WordsExtractRequest | null;
  startedAt: number | null;
  failureKind: FailureKind | null;
  result: WordsExtractResult | null;
}

export interface UploadFlowActions {
  addFromCamera(): Promise<void>;
  addFromGallery(): Promise<void>;
  addFromFiles(): Promise<void>;
  removeFile(id: string): void;
  submit(): Promise<void>;
  /** `failed` + `parse_failed`: re-runs the job without re-uploading. */
  retryParse(): Promise<void>;
  /**
   * `failed` + `parse_slow`: asks `words-extract` again with the same
   * `material_id` — it hands back the same job while that one is alive and
   * restarts it once it is stale, so waiting never ends on a dead job.
   */
  checkAgain(): Promise<void>;
  /**
   * «Отмена» — back to `selecting` with the files kept; the server drops the
   * job and the upload. From `sending` / `reading`, and from the `failed`
   * screens of a parse (`parse_failed`, `parse_slow`).
   */
  cancel(): void;
  /** `failed` + `send_failed`: redoes the whole send with the same `material_id`. */
  retrySend(): Promise<void>;
  /** Returns to `selecting` with the current file list kept — every other recoverable failure. */
  backToSelecting(): void;
  /** `success`: both buttons reset the flow; navigation itself is the screen's job. */
  reset(): void;
}

export type UploadFlowStore = UploadFlowState & UploadFlowActions;

const initialState: UploadFlowState = {
  phase: "selecting",
  files: [],
  materialId: null,
  bannerKey: undefined,
  bannerParams: undefined,
  submitting: false,
  current: 0,
  total: 0,
  jobId: null,
  request: null,
  startedAt: null,
  failureKind: null,
  result: null,
};

type SetFn = StoreApi<UploadFlowStore>["setState"];
type GetFn = StoreApi<UploadFlowStore>["getState"];

function codeOf(err: unknown): string {
  return err instanceof BackendError ? err.code : "internal_error";
}

/** `create`-phase `limits`: reuses the same copy the client-side check would have shown (design spec §2 row 2). */
function limitsBanner(code: string): BannerMessage {
  if (code === "too_many_files") return { key: "upload.error.tooMany" };
  if (code === "total_too_large") return { key: "upload.error.totalTooLarge" };

  // `file_too_large` / `unsupported_type`: every size and type limit is
  // already enforced client-side (§3), so reaching these here is a
  // defensive-only path — the server doesn't name the offending file, so
  // there's no way to point at one truthfully (review round 2, minor m1/m2:
  // guessing "the largest file" can name the wrong one, and an empty-name
  // "«»" sentence is worse than no name). `upload.limits` restates the same
  // limits without needing a filename and is true regardless of which one.
  return { key: "upload.limits" };
}

function failInto(
  set: SetFn,
  phase: ErrorPhase,
  code: string,
  files: SelectedFile[],
  extra: { materialId: string | null; jobId?: string | null; request?: WordsExtractRequest | null },
) {
  const kind = errorRoute(phase, code);
  const freshId = needsFreshMaterialId(kind, code);
  set({
    phase: "failed",
    failureKind: kind,
    files,
    materialId: freshId ? null : extra.materialId,
    jobId: extra.jobId ?? null,
    request: freshId ? null : (extra.request ?? null),
    startedAt: null,
    bannerKey: undefined,
    bannerParams: undefined,
  });
}

/** «Отмена» was pressed (or a newer send started) since this step began. */
function cancelled(get: GetFn, materialId: string | null): boolean {
  const state = get();
  return !(state.phase === "sending" || state.phase === "reading") || state.materialId !== materialId;
}

/**
 * Subscribes to one `words_extract` job and resolves the store into
 * `success` or `failed`. Guarded by `jobId` so a stale call (superseded by a
 * later `checkAgain`/`retryParse`) cannot clobber newer state after it settles.
 */
async function runAwaitWords(
  set: SetFn,
  get: GetFn,
  jobId: string,
  files: SelectedFile[],
  materialId: string | null,
  request: WordsExtractRequest,
) {
  try {
    const result = await wordsRepository.awaitWords(jobId, 120_000);
    if (get().jobId !== jobId) return;
    set({
      phase: "success",
      result,
      files: [],
      materialId: null,
      jobId: null,
      request: null,
      startedAt: null,
    });
  } catch (err) {
    if (get().jobId !== jobId) return;
    failInto(set, "job", codeOf(err), files, { materialId, jobId, request });
  }
}

async function handlePickOutcome(
  outcome: PickOutcome,
  deniedBannerKey: string | undefined,
  set: SetFn,
  get: GetFn,
) {
  if (get().phase !== "selecting") return;
  if (outcome.status === "cancelled") return;
  if (outcome.status === "denied") {
    // Only the camera and gallery pickers can ever produce this outcome
    // (§3 point 6) — the files picker is the system's own UI and never
    // asks the app for a permission of its own.
    if (deniedBannerKey) set({ bannerKey: deniedBannerKey, bannerParams: undefined });
    return;
  }

  const banner = await addPickedAssets(
    outcome.assets,
    get().files,
    {
      onAdd: (file) => set((s) => ({ files: [...s.files, file] })),
      onUpdate: (id, patch) =>
        set((s) => ({ files: s.files.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
      onRemove: (id) => set((s) => ({ files: s.files.filter((f) => f.id !== id) })),
      getFiles: () => get().files,
    },
    uuid,
  );
  set({ bannerKey: banner?.key, bannerParams: banner?.params });
}

export const useUploadFlowStore = create<UploadFlowStore>((set, get) => ({
  ...initialState,

  async addFromCamera() {
    const outcome = await pickFromCamera();
    await handlePickOutcome(outcome, "upload.error.cameraDenied", set, get);
  },

  async addFromGallery() {
    const remaining = MATERIAL_LIMITS.maxFiles - get().files.length;
    if (remaining <= 0) return;
    const outcome = await pickFromGallery(remaining);
    await handlePickOutcome(outcome, "upload.error.galleryDenied", set, get);
  },

  async addFromFiles() {
    const outcome = await pickFromFiles();
    await handlePickOutcome(outcome, undefined, set, get);
  },

  removeFile(id) {
    if (get().phase !== "selecting") return;
    set((s) => ({
      files: s.files.filter((f) => f.id !== id),
      bannerKey: undefined,
      bannerParams: undefined,
    }));
  },

  async submit() {
    const state = get();
    if (state.phase !== "selecting") return;
    if (state.files.length === 0 || state.files.some((f) => f.preparing)) return;

    set({ submitting: true });

    const materialId = state.materialId ?? uuid();
    const files = state.files;

    set({
      phase: "sending",
      materialId,
      files,
      current: 0,
      total: files.length,
      submitting: false,
      bannerKey: undefined,
      bannerParams: undefined,
    });

    const paths: string[] = [];
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const position = i + 1;
      // The number shown is "which file is uploading now", not "how many
      // have finished" — set it before the call starts, or the whole first
      // file uploads under "Файл 0 из N" (review round 2, B1).
      set({ current: position });
      try {
        const uploaded = await moduleRepository.uploadFile(materialId, position, {
          uri: file.uri,
          extension: file.extension,
          mimeType: file.mimeType,
        });
        paths[i] = uploaded.path;
      } catch {
        if (cancelled(get, materialId)) return;
        failInto(set, "upload", "upload_failed", files, { materialId });
        return;
      }
      if (cancelled(get, materialId)) return;
    }

    const request: WordsExtractRequest = {
      material_id: materialId,
      files: files.map((file, i) => ({
        path: paths[i],
        filename: displayNameFor(files, file),
        mime_type: file.mimeType,
        size_bytes: file.sizeBytes,
      })),
    };

    let created;
    try {
      created = await wordsRepository.extract(request);
    } catch (err) {
      if (cancelled(get, materialId)) return;
      const code = codeOf(err);
      const kind = errorRoute("create", code);
      if (kind === "limits") {
        const banner = limitsBanner(code);
        set({
          phase: "selecting",
          files,
          materialId: needsFreshMaterialId(kind, code) ? null : materialId,
          bannerKey: banner.key,
          bannerParams: banner.params,
          submitting: false,
        });
        return;
      }
      failInto(set, "create", code, files, { materialId });
      return;
    }
    if (cancelled(get, materialId)) return;

    set({
      phase: "reading",
      files,
      materialId,
      jobId: created.job_id,
      request,
      startedAt: Date.now(),
    });

    await runAwaitWords(set, get, created.job_id, files, materialId, request);
  },

  async retryParse() {
    const state = get();
    if (state.phase !== "failed" || state.failureKind !== "parse_failed" || !state.request) return;
    const { files, materialId, request } = state;

    // Leave `failed` synchronously, before the `await` below — otherwise a
    // second tap lands while the first call is still in flight and passes the
    // guard above (review round 2, B2). `jobId: null` is a placeholder the
    // `WaitingScreen` doesn't read.
    set({ phase: "reading", files, materialId, request, jobId: null, startedAt: Date.now(), failureKind: null });

    try {
      // Same `material_id`: after a failed job `words-extract` starts a new one
      // over the files still in Storage — nothing is uploaded again.
      const ref = await wordsRepository.extract(request);
      set({ jobId: ref.job_id });
      await runAwaitWords(set, get, ref.job_id, files, materialId, request);
    } catch (err) {
      failInto(set, "retry", codeOf(err), files, { materialId, request });
    }
  },

  async checkAgain() {
    const state = get();
    if (state.phase !== "failed" || state.failureKind !== "parse_slow" || !state.jobId || !state.request) {
      return;
    }
    const { files, materialId, request } = state;

    set({ phase: "reading", files, materialId, request, jobId: null, startedAt: Date.now(), failureKind: null });
    try {
      const ref = await wordsRepository.extract(request);
      if (cancelled(get, materialId)) return;
      set({ jobId: ref.job_id });
      await runAwaitWords(set, get, ref.job_id, files, materialId, request);
    } catch (err) {
      if (cancelled(get, materialId)) return;
      failInto(set, "retry", codeOf(err), files, { materialId, request });
    }
  },

  cancel() {
    const state = get();
    const cancellableFailure =
      state.phase === "failed" && (state.failureKind === "parse_failed" || state.failureKind === "parse_slow");
    if (state.phase !== "sending" && state.phase !== "reading" && !cancellableFailure) return;
    const oldMaterialId = state.materialId;
    // A fresh `material_id` on the next send: the old one is being dropped
    // server-side. `jobId: null` makes any in-flight wait ignore its result.
    set({
      phase: "selecting",
      files: state.files,
      materialId: null,
      jobId: null,
      request: null,
      startedAt: null,
      current: 0,
      total: 0,
      submitting: false,
      failureKind: null,
      bannerKey: undefined,
      bannerParams: undefined,
    });
    if (oldMaterialId) void wordsRepository.cancel(oldMaterialId).catch(() => undefined);
  },

  async retrySend() {
    const state = get();
    if (state.phase !== "failed" || state.failureKind !== "send_failed") return;
    set({
      phase: "selecting",
      files: state.files,
      materialId: state.materialId,
      bannerKey: undefined,
      bannerParams: undefined,
      submitting: false,
      failureKind: null,
    });
    await get().submit();
  },

  backToSelecting() {
    const state = get();
    if (state.phase !== "failed") return;
    set({
      phase: "selecting",
      files: state.files,
      materialId: state.materialId,
      bannerKey: undefined,
      bannerParams: undefined,
      submitting: false,
      jobId: null,
      request: null,
      startedAt: null,
      failureKind: null,
    });
  },

  reset() {
    set({ ...initialState, files: [] });
  },
}));
