import type { ModuleCreateRequest, ModuleCreateResponse, ModuleParseResult } from "@yuny/shared";

/**
 * One file about to be uploaded to Storage. `extension` drives the object
 * key (`{user_id}/{material_id}/{position}.{ext}` — design spec §1, never
 * the original filename: Storage keys reject Cyrillic and spaces, and two
 * camera shots would otherwise collide on the same name).
 */
export interface UploadFileInput {
  uri: string;
  extension: string;
  mimeType: string;
}

/** `module-parse` retry response — the same envelope every async job starts with (TZ.md §6). */
export interface JobRef {
  job_id: string;
  kind: "module_parse";
}

/**
 * Domain for turning an uploaded material into a module (TZ.md §13; design
 * spec §1). Any implementation must run its responses through the
 * `@yuny/shared` schemas before returning — the mock validates fixtures the
 * same way the Supabase implementation validates the network.
 */
export interface ModuleRepository {
  /**
   * Uploads one file's bytes to `materials/{user_id}/{material_id}/{position}.{ext}`
   * and returns the exact Storage path used, so the caller can pass the same
   * value on to `createModule`'s `files[].path` without duplicating how the
   * key is built (the `user_id` segment lives inside the repository, not the
   * caller).
   */
  uploadFile(materialId: string, position: number, file: UploadFileInput): Promise<{ path: string }>;
  /** Creates the module and starts its parse job. */
  createModule(req: ModuleCreateRequest): Promise<ModuleCreateResponse>;
  /** Resolves when the parse job finishes, or rejects with a `BackendError`. */
  awaitParse(jobId: string, timeoutMs?: number): Promise<ModuleParseResult>;
  /** Restarts a parse job for a module whose previous parse failed for a reason not caused by the material itself. */
  retryParse(moduleId: string): Promise<JobRef>;
}
