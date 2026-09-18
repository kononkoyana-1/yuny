import { describe, expect, it, jest } from "@jest/globals";
import { MATERIAL_LIMITS } from "@yuny/shared";
import { addPickedAssets, displayNameFor, photoNumber, type SelectedFile } from "./selection";
import type { RawAsset } from "./sources";

/**
 * Pure-function coverage for `selection.ts` (design review round 2, decision
 * 1): numbering and naming, and the order of §3's per-file checks. Most
 * cases here are a PDF or DOCX and never touch `compressImage` (the only
 * piece of this file that reaches a native module, `expo-image-manipulator`).
 * The one suite that does (`addPickedAssets — live total across an async
 * compression`, design review round 2, m6) mocks `react-native`'s
 * `Image.getSize`, `expo-image-manipulator`, and `global.fetch` — the three
 * native/DOM boundaries `compressImage` crosses — with a controllable
 * `Image.getSize` so the test can insert a second file mid-compression
 * deterministically rather than racing real timers.
 */

jest.mock("react-native", () => ({
  Image: { getSize: jest.fn() },
}));

jest.mock("expo-image-manipulator", () => ({
  SaveFormat: { JPEG: "jpeg" },
  ImageManipulator: { manipulate: jest.fn() },
}));

function makeFile(overrides: Partial<SelectedFile> = {}): SelectedFile {
  return {
    id: overrides.id ?? "id",
    kind: overrides.kind ?? "image",
    uri: overrides.uri ?? "file:///a.jpg",
    mimeType: overrides.mimeType ?? "image/jpeg",
    extension: overrides.extension ?? "jpg",
    originalName: overrides.originalName ?? null,
    sizeBytes: overrides.sizeBytes ?? 0,
    preparing: overrides.preparing ?? false,
  };
}

function pdfAsset(name: string, size: number): RawAsset {
  return { uri: `file:///${name}`, name, mimeType: "application/pdf", size };
}

function docxAsset(name: string, size: number): RawAsset {
  return {
    uri: `file:///${name}`,
    name,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size,
  };
}

function callbacks(initial: SelectedFile[] = []) {
  const files: SelectedFile[] = [...initial];
  return {
    files,
    cb: {
      onAdd: (file: SelectedFile) => files.push(file),
      onUpdate: (id: string, patch: Partial<SelectedFile>) => {
        const i = files.findIndex((f) => f.id === id);
        if (i >= 0) files[i] = { ...files[i], ...patch };
      },
      onRemove: (id: string) => {
        const i = files.findIndex((f) => f.id === id);
        if (i >= 0) files.splice(i, 1);
      },
      getFiles: () => files,
    },
  };
}

function makeId(): () => string {
  let n = 0;
  return () => `id-${n++}`;
}

describe("photoNumber", () => {
  it("counts only images, 1-based, in list order", () => {
    const files = [
      makeFile({ id: "a", kind: "image" }),
      makeFile({ id: "b", kind: "pdf" }),
      makeFile({ id: "c", kind: "image" }),
    ];
    expect(photoNumber(files, "a")).toBe(1);
    expect(photoNumber(files, "c")).toBe(2);
  });

  it("recomputes after a sibling photo is removed", () => {
    const before = [
      makeFile({ id: "a", kind: "image" }),
      makeFile({ id: "b", kind: "image" }),
    ];
    expect(photoNumber(before, "b")).toBe(2);

    const after = before.filter((f) => f.id !== "a");
    expect(photoNumber(after, "b")).toBe(1);
  });
});

describe("displayNameFor", () => {
  it("names photos upload.file.photoName {{n}} by position among photos", () => {
    const files = [makeFile({ id: "a", kind: "image" }), makeFile({ id: "b", kind: "image" })];
    expect(displayNameFor(files, files[0])).toBe("Фото 1");
    expect(displayNameFor(files, files[1])).toBe("Фото 2");
  });

  it("uses the original filename for PDF/DOCX", () => {
    const file = makeFile({ kind: "pdf", originalName: "Учебник.pdf" });
    expect(displayNameFor([file], file)).toBe("Учебник.pdf");
  });
});

describe("addPickedAssets — order of checks (§3)", () => {
  it("slots: takes only the remaining slots and reports upload.error.tooMany", async () => {
    const { files, cb } = callbacks();
    const existing = [makeFile({ id: "existing", kind: "pdf" }), makeFile({ id: "existing2", kind: "pdf" })];
    const banner = await addPickedAssets(
      [pdfAsset("a.pdf", 1000), pdfAsset("b.pdf", 1000)],
      existing,
      cb,
      makeId(),
    );
    expect(banner).toEqual({ key: "upload.error.tooMany" });
    expect(files).toHaveLength(1); // only one slot was free (maxFiles 3, 2 existing)
    expect(files[0].originalName).toBe("a.pdf"); // first by order, not the second
  });

  it("type: rejects an unsupported MIME/extension before touching size or total", async () => {
    const { files, cb } = callbacks();
    const banner = await addPickedAssets(
      [{ uri: "file:///a.exe", name: "a.exe", mimeType: "application/x-msdownload", size: 10 }],
      [],
      cb,
      makeId(),
    );
    expect(banner).toEqual({ key: "upload.error.unsupported", params: { name: "a.exe" } });
    expect(files).toHaveLength(0);
  });

  it("size: a PDF over pdfMaxBytes is rejected even though the running total is fine", async () => {
    const { files, cb } = callbacks();
    const tooLarge = MATERIAL_LIMITS.pdfMaxBytes + 1;
    const banner = await addPickedAssets([pdfAsset("big.pdf", tooLarge)], [], cb, makeId());
    expect(banner).toEqual({ key: "upload.error.pdfTooLarge", params: { name: "big.pdf" } });
    expect(files).toHaveLength(0);
  });

  it("total: a file under its own limit is still rejected once the running sum would cross maxTotalBytes", async () => {
    const existing = [
      makeFile({ id: "existing", kind: "pdf", sizeBytes: MATERIAL_LIMITS.maxTotalBytes - 1000 }),
    ];
    const { files, cb } = callbacks(existing);
    const banner = await addPickedAssets([pdfAsset("small.pdf", 2000)], existing, cb, makeId());
    expect(banner).toEqual({ key: "upload.error.totalTooLarge" });
    expect(files).toHaveLength(1); // only the pre-existing file — nothing new was added
  });

  it("accepts a file that clears every check, with no banner", async () => {
    const { files, cb } = callbacks();
    const banner = await addPickedAssets([docxAsset("ok.docx", 1000)], [], cb, makeId());
    expect(banner).toBeUndefined();
    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({ kind: "docx", originalName: "ok.docx", sizeBytes: 1000 });
  });

  it("keeps only the last banner when several files fail different checks in one batch", async () => {
    const { cb } = callbacks();
    const tooLargePdf = MATERIAL_LIMITS.pdfMaxBytes + 1;
    const banner = await addPickedAssets(
      [
        { uri: "file:///a.exe", name: "a.exe", mimeType: "application/x-msdownload", size: 10 }, // type
        pdfAsset("big.pdf", tooLargePdf), // size — last failure, should win
      ],
      [],
      cb,
      makeId(),
    );
    expect(banner).toEqual({ key: "upload.error.pdfTooLarge", params: { name: "big.pdf" } });
  });
});

describe("addPickedAssets — naming a file the picker gave no name for (v1.1, Acceptance 26)", () => {
  it("names it upload.file.unnamed in the row, never the uri", async () => {
    const { files, cb } = callbacks();
    const banner = await addPickedAssets([docxAsset("", 1000)], [], cb, makeId());
    expect(banner).toBeUndefined();
    expect(files[0].originalName).toBe("Файл без названия");
  });

  it("uses upload.file.unnamed in an upload.error.* banner instead of the uri", async () => {
    const { cb } = callbacks();
    const tooLarge = MATERIAL_LIMITS.pdfMaxBytes + 1;
    const banner = await addPickedAssets(
      [{ uri: "file:///blob:abcd", name: undefined, mimeType: "application/pdf", size: tooLarge }],
      [],
      cb,
      makeId(),
    );
    expect(banner).toEqual({ key: "upload.error.pdfTooLarge", params: { name: "Файл без названия" } });
  });
});

describe("addPickedAssets — live total across an async compression (Acceptance 27–28, m6)", () => {
  it("removes a photo that only overflows maxTotalBytes once a sibling added mid-compression is counted", async () => {
    type GetSize = (uri: string, success: (w: number, h: number) => void, error: (e: unknown) => void) => void;
    type ManipulateContext = { resize: jest.Mock; renderAsync: jest.Mock };
    type Manipulate = (uri: string) => ManipulateContext;

    const { Image } = jest.requireMock("react-native") as { Image: { getSize: jest.Mock<GetSize> } };
    const { ImageManipulator } = jest.requireMock("expo-image-manipulator") as {
      ImageManipulator: { manipulate: jest.Mock<Manipulate> };
    };

    // Individually every number below stays under its own type limit
    // (`existing` doesn't go through a check at all — it is already in the
    // list before this call starts, same as any other pre-existing file);
    // it is only their sum, checked against the *live* list, that crosses
    // `maxTotalBytes`.
    const existing = makeFile({
      id: "existing",
      kind: "docx",
      sizeBytes: MATERIAL_LIMITS.maxTotalBytes - 6000,
    });
    const docSize = 1000; // existing + doc = maxTotalBytes - 5000: fits alone, with room to spare.
    const compressedSize = 5500; // existing + doc + compressed = maxTotalBytes + 500: over.

    const getSizeControl: { release: (() => void) | null } = { release: null };
    Image.getSize.mockImplementation((_uri: string, success: (w: number, h: number) => void) => {
      getSizeControl.release = () => success(100, 100);
    });
    type SaveAsync = () => Promise<{ uri: string }>;
    type RenderAsync = () => Promise<{ saveAsync: jest.Mock<SaveAsync> }>;
    const saveAsync = jest.fn<SaveAsync>().mockResolvedValue({ uri: "file:///compressed.jpg" });
    const renderAsync: jest.Mock<RenderAsync> = jest.fn<RenderAsync>().mockResolvedValue({ saveAsync });
    ImageManipulator.manipulate.mockReturnValue({
      resize: jest.fn().mockReturnThis(),
      renderAsync,
    });
    type Fetch = (uri: string) => Promise<{ arrayBuffer: () => Promise<ArrayBuffer> }>;
    (global as { fetch?: Fetch }).fetch = jest
      .fn<Fetch>()
      .mockResolvedValue({ arrayBuffer: async () => new ArrayBuffer(compressedSize) });

    const { files, cb } = callbacks([existing]);

    // Starts compressing; stays pending until `releaseGetSize()` is called below.
    const photoPromise = addPickedAssets(
      [{ uri: "file:///photo.jpg", name: "photo.jpg", mimeType: "image/jpeg" }],
      [existing],
      cb,
      makeId(),
    );
    await Promise.resolve();
    await Promise.resolve();
    expect(files).toHaveLength(2); // existing + the preparing placeholder

    // A document arrives — and finishes — while the photo is still compressing.
    const docBanner = await addPickedAssets([pdfAsset("doc.pdf", docSize)], files, cb, makeId());
    expect(docBanner).toBeUndefined();
    expect(files).toHaveLength(3);

    getSizeControl.release?.();
    const photoBanner = await photoPromise;

    expect(photoBanner).toEqual({ key: "upload.error.totalTooLarge" });
    expect(files).toHaveLength(2);
    expect(files.map((f) => f.kind)).toEqual(["docx", "pdf"]);
  });
});
