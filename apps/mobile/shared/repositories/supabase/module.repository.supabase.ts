import {
  ModuleCreateRequestSchema,
  ModuleCreateResponseSchema,
  ModuleParseRequestSchema,
  ModuleParseResultSchema,
  ModuleProgressSchema,
} from "@yuny/shared";
import { z } from "zod";
import { BackendError } from "@/shared/lib/backendError";
import { requireUserId } from "@/shared/lib/auth";
import { getSupabase } from "@/shared/lib/supabase";
import { awaitJob, jobRefSchema } from "@/shared/lib/jobs";
import { invokeEdge } from "@/shared/lib/edge";
import type { ModuleRepository, UploadFileInput } from "../module.repository";

/**
 * `materials` bucket, `{user_id}/{material_id}/{position}.{ext}` (design
 * spec §1). Bytes come from `fetch(uri).arrayBuffer()` rather than
 * `expo-file-system` — that one call reads a `file://` URI on native and a
 * blob URI on web identically, which is why the spec's precondition P3
 * leaves `expo-file-system` out of the dependency list entirely.
 */
export const supabaseModuleRepository: ModuleRepository = {
  async uploadFile(materialId, position, file: UploadFileInput) {
    const userId = await requireUserId();
    const path = `${userId}/${materialId}/${position}.${file.extension}`;

    let bytes: ArrayBuffer;
    try {
      const response = await fetch(file.uri);
      bytes = await response.arrayBuffer();
    } catch {
      throw new BackendError("upload_read_failed");
    }

    const { error } = await getSupabase()
      .storage.from("materials")
      .upload(path, bytes, { contentType: file.mimeType, upsert: true });
    if (error) throw new BackendError("upload_failed");

    return { path };
  },

  async createModule(req) {
    const body = ModuleCreateRequestSchema.parse(req);
    const data = await invokeEdge<unknown>("module-create", body);
    return ModuleCreateResponseSchema.parse(data);
  },

  async awaitParse(jobId, timeoutMs = 120_000) {
    const result = await awaitJob<unknown>(jobId, timeoutMs);
    return ModuleParseResultSchema.parse(result);
  },

  async retryParse(moduleId) {
    const body = ModuleParseRequestSchema.parse({ module_id: moduleId });
    const data = await invokeEdge<unknown>("module-parse", body);
    return jobRefSchema("module_parse").parse(data);
  },

  async listModules() {
    const { data, error } = await getSupabase()
      .from("module_progress")
      .select("module_id,title,topic,created_at,generation,total_tasks,done_tasks,cover_text")
      .order("created_at", { ascending: false });
    if (error) throw new BackendError("internal_error");
    return z.array(ModuleProgressSchema).parse(data);
  },
};
