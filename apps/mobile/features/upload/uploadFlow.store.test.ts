import { describe, expect, it, jest, beforeEach } from "@jest/globals";

import { queryClient } from "@/shared/api/queryClient";
import { queryKeys } from "@/shared/api/queryKeys";
import { useUploadFlowStore } from "./uploadFlow.store";

/**
 * Covers home.design.md §1 Acceptance #3: parse success invalidates
 * `queryKeys.modules` so Главная picks up the new module without waiting for
 * `useFocusEffect`'s own refetch. `moduleRepository` is mocked so the test
 * runs on fake, instant promises rather than the real mock repository's
 * artificial network delay.
 */
jest.mock("expo-crypto", () => ({
  randomUUID: () => "00000000-0000-4000-8000-000000000000",
}));

// `mock`-prefixed per babel-plugin-jest-hoist's out-of-scope-variable rule —
// only names starting with `mock` (case-insensitive) may be referenced from
// inside a hoisted `jest.mock()` factory.
const mockUploadFile = jest.fn(async () => ({ path: "materials/1.jpg" }));
const mockCreateModule = jest.fn(async () => ({
  job_id: "job-1",
  kind: "module_parse" as const,
  module_id: "module-1",
}));
const mockAwaitParse = jest.fn(async () => ({
  module_id: "module-1",
  vocabulary_count: 18,
  grammar_count: 2,
}));

jest.mock("@/shared/repositories", () => ({
  moduleRepository: {
    uploadFile: (...args: unknown[]) => mockUploadFile(...(args as [])),
    createModule: (...args: unknown[]) => mockCreateModule(...(args as [])),
    awaitParse: (...args: unknown[]) => mockAwaitParse(...(args as [])),
    retryParse: jest.fn(),
    listModules: jest.fn(async () => []),
  },
}));

describe("uploadFlow.store — success invalidates Главная's modules query", () => {
  beforeEach(() => {
    mockUploadFile.mockClear();
    mockCreateModule.mockClear();
    mockAwaitParse.mockClear();
    useUploadFlowStore.getState().reset();
  });

  it("calls queryClient.invalidateQueries({ queryKey: queryKeys.modules }) once parse succeeds", async () => {
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    useUploadFlowStore.setState({
      files: [
        {
          id: "f1",
          kind: "image",
          uri: "file:///f1.jpg",
          extension: "jpg",
          mimeType: "image/jpeg",
          originalName: null,
          sizeBytes: 1000,
          preparing: false,
        },
      ],
    });

    await useUploadFlowStore.getState().submit();

    expect(useUploadFlowStore.getState().phase).toBe("success");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.modules });

    invalidateSpy.mockRestore();
  });
});
