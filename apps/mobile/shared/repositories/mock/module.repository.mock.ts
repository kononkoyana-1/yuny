import {
  ModuleCreateResponseSchema,
  ModuleParseResultSchema,
  type ModuleCreateRequest,
} from "@yuny/shared";
import { jobRefSchema } from "@/shared/lib/jobs";
import type { ModuleRepository } from "../module.repository";
import { delay } from "./delay";

/** Local id generator — the mock has no native `expo-crypto` dependency of its own. */
function mockId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface MockJob {
  moduleId: string;
}

/** `job_id → module_id`, so `awaitParse`/`retryParse` answer consistently within a session. */
const jobs = new Map<string, MockJob>();

export const mockModuleRepository: ModuleRepository = {
  async uploadFile(materialId, position, file) {
    await delay(undefined, 250);
    return { path: `${materialId}/${position}.${file.extension}` };
  },

  async createModule(_req: ModuleCreateRequest) {
    const jobId = mockId();
    const moduleId = mockId();
    jobs.set(jobId, { moduleId });
    return delay(
      ModuleCreateResponseSchema.parse({ job_id: jobId, kind: "module_parse", module_id: moduleId }),
      400,
    );
  },

  async awaitParse(jobId: string) {
    const job = jobs.get(jobId);
    const moduleId = job?.moduleId ?? mockId();
    return delay(
      ModuleParseResultSchema.parse({ module_id: moduleId, vocabulary_count: 18, grammar_count: 2 }),
      1500,
    );
  },

  async retryParse(moduleId: string) {
    const jobId = mockId();
    jobs.set(jobId, { moduleId });
    return delay(jobRefSchema("module_parse").parse({ job_id: jobId, kind: "module_parse" }), 300);
  },
};
