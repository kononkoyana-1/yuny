import { describe, expect, it, jest } from "@jest/globals";

/**
 * home.design.md §1, Acceptance #1: the mock repository must run fixtures
 * (а)-(д) through `ModuleProgressSchema` the same way the Supabase
 * implementation validates the network — this is the one place that
 * actually calls `.parse()` on them (Главная's own render effects don't run
 * under `expo export`'s static prerender, so nothing else exercises this).
 *
 * `module.repository.mock.ts` pulls in `shared/lib/jobs` → `shared/lib/supabase`
 * unconditionally (it's used for `awaitParse`/`retryParse`, unrelated to
 * `listModules`), which reaches for `@react-native-async-storage/async-storage`'s
 * native module — unavailable under Jest, hence the stub.
 */
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
}));

// eslint-disable-next-line import/first -- `jest.mock` above must run before this import; babel hoists the call itself, but the source order still needs to keep them adjacent for that hoisting to be legible.
import { mockModuleRepository } from "@/shared/repositories/mock/module.repository.mock";
describe("mockModuleRepository.listModules", () => {
  it("resolves the five fixtures from §1 through ModuleProgressSchema", async () => {
    const modules = await mockModuleRepository.listModules();
    expect(modules).toHaveLength(5);

    // (в) the completed fixture: full ring, done === total.
    const completed = modules.find((m) => m.done_tasks === m.total_tasks);
    expect(completed).toBeDefined();

    // (г) long title, no topic.
    const noTopic = modules.find((m) => m.topic === null);
    expect(noTopic?.title.length).toBeGreaterThan(60);

    // (д) no cover_text.
    expect(modules.some((m) => m.cover_text === null)).toBe(true);

    // (а) a fresh, untouched module.
    expect(modules.some((m) => m.done_tasks === 0)).toBe(true);
  });
});
