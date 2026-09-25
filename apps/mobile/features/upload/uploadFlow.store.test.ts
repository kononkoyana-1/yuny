import { describe, expect, it, jest, beforeEach } from "@jest/globals";

import { BackendError } from "@/shared/lib/backendError";
import { useUploadFlowStore } from "./uploadFlow.store";

/**
 * The upload flow reads a file for words (`words-extract`) since 2026-09-23.
 * Repositories are mocked so the test runs on instant promises rather than
 * the mock repository's artificial network delay.
 */
jest.mock("@/shared/lib/uuid", () => ({
  uuid: () => "00000000-0000-4000-8000-000000000000",
}));

// `mock`-prefixed per babel-plugin-jest-hoist's out-of-scope-variable rule —
// only names starting with `mock` (case-insensitive) may be referenced from
// inside a hoisted `jest.mock()` factory.
const mockUploadFile = jest.fn(async () => ({ path: "u/m/1.jpg" }));
const mockExtract = jest.fn(async () => ({
  job_id: "11111111-1111-4111-8111-111111111111",
  kind: "words_extract" as const,
  material_id: "00000000-0000-4000-8000-000000000000",
}));
const mockWords = {
  title: "Урок 5",
  words: [{ word: "买", reading: "mǎi", translation: "покупать", source: "file" as const, entry_id: 1 }],
};
const mockAwaitWords = jest.fn<() => Promise<typeof mockWords>>(async () => mockWords);
const mockCancel = jest.fn(async () => undefined);

jest.mock("@/shared/repositories", () => ({
  moduleRepository: {
    uploadFile: (...args: unknown[]) => mockUploadFile(...(args as [])),
  },
  wordsRepository: {
    extract: (...args: unknown[]) => mockExtract(...(args as [])),
    awaitWords: (...args: unknown[]) => mockAwaitWords(...(args as [])),
    cancel: (...args: unknown[]) => mockCancel(...(args as [])),
  },
}));

const file = {
  id: "f1",
  kind: "image" as const,
  uri: "file:///f1.jpg",
  extension: "jpg",
  mimeType: "image/jpeg",
  originalName: null,
  sizeBytes: 1000,
  preparing: false,
};

describe("uploadFlow.store — words from a file", () => {
  beforeEach(() => {
    mockUploadFile.mockClear();
    mockExtract.mockClear();
    mockAwaitWords.mockReset();
    mockAwaitWords.mockImplementation(async () => mockWords);
    mockCancel.mockClear();
    useUploadFlowStore.getState().reset();
  });

  it("«Отмена» while reading: back to the file list, server told, a late result ignored", async () => {
    let finish!: (words: typeof mockWords) => void;
    mockAwaitWords.mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)));
    useUploadFlowStore.setState({ files: [file] });
    const running = useUploadFlowStore.getState().submit();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(useUploadFlowStore.getState().phase).toBe("reading");

    useUploadFlowStore.getState().cancel();
    expect(mockCancel).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000000");
    finish(mockWords);
    await running;

    const state = useUploadFlowStore.getState();
    expect(state.phase).toBe("selecting");
    expect(state.files).toEqual([file]);
    expect(state.materialId).toBeNull();
    expect(state.result).toBeNull();
  });

  it("«Подождать ещё» asks words-extract again instead of re-waiting a dead job", async () => {
    mockAwaitWords.mockImplementationOnce(async () => {
      throw new BackendError("timeout");
    });
    useUploadFlowStore.setState({ files: [file] });
    await useUploadFlowStore.getState().submit();
    expect(useUploadFlowStore.getState().failureKind).toBe("parse_slow");

    await useUploadFlowStore.getState().checkAgain();
    expect(mockExtract).toHaveBeenCalledTimes(2);
    expect(useUploadFlowStore.getState().phase).toBe("success");
  });

  it("uploads, asks words-extract with the uploaded paths, and lands on the word list", async () => {
    useUploadFlowStore.setState({ files: [file] });
    await useUploadFlowStore.getState().submit();

    expect(mockExtract).toHaveBeenCalledWith({
      material_id: "00000000-0000-4000-8000-000000000000",
      files: [{ path: "u/m/1.jpg", filename: "Фото 1", mime_type: "image/jpeg", size_bytes: 1000 }],
    });
    const state = useUploadFlowStore.getState();
    expect(state.phase).toBe("success");
    expect(state.result).toEqual(mockWords);
  });

  it("retries a failed parse by resending the same request, without uploading again", async () => {
    mockAwaitWords.mockImplementationOnce(async () => {
      throw new BackendError("ai_unavailable");
    });
    useUploadFlowStore.setState({ files: [file] });
    await useUploadFlowStore.getState().submit();
    expect(useUploadFlowStore.getState().failureKind).toBe("parse_failed");

    await useUploadFlowStore.getState().retryParse();

    expect(mockUploadFile).toHaveBeenCalledTimes(1);
    expect(mockExtract).toHaveBeenCalledTimes(2);
    expect(mockExtract.mock.calls[1]).toEqual(mockExtract.mock.calls[0]);
    expect(useUploadFlowStore.getState().phase).toBe("success");
  });

  it("routes a file without Chinese words to the rejected screen", async () => {
    mockAwaitWords.mockImplementationOnce(async () => {
      throw new BackendError("not_language_material");
    });
    useUploadFlowStore.setState({ files: [file] });
    await useUploadFlowStore.getState().submit();
    expect(useUploadFlowStore.getState().failureKind).toBe("material_rejected");
  });
});
