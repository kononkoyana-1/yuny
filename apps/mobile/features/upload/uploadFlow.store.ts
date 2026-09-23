import { create, type StoreApi } from "zustand";
import { uuid } from "@/shared/lib/uuid";
import { MATERIAL_LIMITS, type ModuleParseResult } from "@yuny/shared";
import { moduleRepository } from "@/shared/repositories";
import { BackendError } from "@/shared/lib/backendError";
import { queryClient } from "@/shared/api/queryClient";
import { queryKeys } from "@/shared/api/queryKeys";
import { addPickedAssets, displayNameFor, type SelectedFile, type BannerMessage } from "./selection";
import { pickFromCamera, pickFromFiles, pickFromGallery, type PickOutcome } from "./sources";
import { errorRoute, needsFreshMaterialId, type ErrorPhase, type FailureKind } from "./errorRoute";

/**
 * The one state machine for screen 02 + the parse-wait screen (design spec
 * §1): `selecting → sending → reading → success`, with `failed` reachable
 * from `sending`/`reading` per §2's routing table. Lives in a Zustand store,
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
  moduleId: string | null;
  startedAt: number | null;
  failureKind: FailureKind | null;
  result: ModuleParseResult | null;
}

export interface UploadFlowActions {
  addFromCamera(): Promise<void>;
  addFromGallery(): Promise<void>;
  addFromFiles(): Promise<void>;
  removeFile(id: string): void;
  submit(): Promise<void>;
  /** `failed` + `parse_failed`: re-runs the job without re-uploading. */
  retryParse(): Promise<void>;
  /** `failed` + `parse_slow`: re-subscribes to the SAME job id. */
  checkAgain(): Promise<void>;
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
  moduleId: null,
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
  extra: { materialId: string | null; jobId?: string | null; moduleId?: string | null },
) {
  const kind = errorRoute(phase, code);
  const freshId = needsFreshMaterialId(kind, code);
  set({
    phase: "failed",
    failureKind: kind,
    files,
    materialId: freshId ? null : extra.materialId,
    jobId: extra.jobId ?? null,
    moduleId: extra.moduleId ?? null,
    startedAt: null,
    bannerKey: undefined,
    bannerParams: undefined,
  });
}

/**
 * Subscribes to one parse job and resolves the store into `success` or
 * `failed`. Guarded by `jobId` so a stale call (superseded by a later
 * `checkAgain`/`retryParse`) cannot clobber newer state after it settles.
 */
async function runAwaitParse(
  set: SetFn,
  get: GetFn,
  jobId: string,
  files: SelectedFile[],
  materialId: string | null,
  moduleId: string | null,
) {
  try {
    const result = await moduleRepository.awaitParse(jobId, 120_000);
    if (get().jobId !== jobId) return;
    set({
      phase: "success",
      result,
      files: [],
      materialId: null,
      jobId: null,
      moduleId: null,
      startedAt: null,
    });
    // Fires at the moment of success, not on the "На главную" button
    // (home.design.md §1): a user can reach Главная through the tab bar
    // instead, and the new module must already be there when they do.
    void queryClient.invalidateQueries({ queryKey: queryKeys.modules });
  } catch (err) {
    if (get().jobId !== jobId) return;
    failInto(set, "job", codeOf(err), files, { materialId, jobId, moduleId });
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
        failInto(set, "upload", "upload_failed", files, { materialId });
        return;
      }
    }

    let created;
    try {
      created = await moduleRepository.createModule({
        material_id: materialId,
        files: files.map((file, i) => ({
          path: paths[i],
          filename: displayNameFor(files, file),
          mime_type: file.mimeType,
          size_bytes: file.sizeBytes,
        })),
      });
    } catch (err) {
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

    set({
      phase: "reading",
      files,
      materialId,
      jobId: created.job_id,
      moduleId: created.module_id,
      startedAt: Date.now(),
    });

    await runAwaitParse(set, get, created.job_id, files, materialId, created.module_id);
  },

  async retryParse() {
    const state = get();
    if (state.phase !== "failed" || state.failureKind !== "parse_failed" || !state.moduleId) return;
    const { files, materialId, moduleId } = state;

    // Leave `failed` synchronously, before the `await` below — otherwise a
    // second tap lands while the first `module-parse` call is still in
    // flight, passes the guard above (phase is still `failed`), and fires a
    // second retry. The module is already `parsing` by then, so the second
    // call gets `module_not_retryable` and routes to `lost`, discarding the
    // first, healthy retry (review round 2, B2). `jobId: null` here is a
    // placeholder the `WaitingScreen` doesn't read; `runAwaitParse`'s own
    // `jobId` guard only starts caring once it is set below.
    set({ phase: "reading", files, materialId, moduleId, jobId: null, startedAt: Date.now(), failureKind: null });

    try {
      const ref = await moduleRepository.retryParse(moduleId);
      set({ jobId: ref.job_id });
      await runAwaitParse(set, get, ref.job_id, files, materialId, moduleId);
    } catch (err) {
      failInto(set, "retry", codeOf(err), files, { materialId, moduleId });
    }
  },

  async checkAgain() {
    const state = get();
    if (state.phase !== "failed" || state.failureKind !== "parse_slow" || !state.jobId) return;
    const { files, materialId, jobId, moduleId } = state;

    set({ phase: "reading", files, materialId, moduleId, jobId, startedAt: Date.now(), failureKind: null });
    await runAwaitParse(set, get, jobId, files, materialId, moduleId);
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
      moduleId: null,
      startedAt: null,
      failureKind: null,
    });
  },

  reset() {
    set({ ...initialState, files: [] });
  },
}));
