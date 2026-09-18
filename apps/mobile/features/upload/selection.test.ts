import { describe, expect, it } from "@jest/globals";
import { MATERIAL_LIMITS } from "@yuny/shared";
import { addPickedAssets, displayNameFor, photoNumber, type SelectedFile } from "./selection";
import type { RawAsset } from "./sources";

/**
 * Pure-function coverage for `selection.ts` (design review round 2, decision
 * 1): numbering and naming, and the order of §3's per-file checks. Every
 * asset here is a PDF or DOCX — none of these paths touch `compressImage`
 * (the only piece of this file that reaches a native module,
 * `expo-image-manipulator`), so the whole suite runs without mocking
 * anything native.
 */

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

function callbacks() {
  const files: SelectedFile[] = [];
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
    const { files, cb } = callbacks();
    const existing = [
      makeFile({ id: "existing", kind: "pdf", sizeBytes: MATERIAL_LIMITS.maxTotalBytes - 1000 }),
    ];
    const banner = await addPickedAssets([pdfAsset("small.pdf", 2000)], existing, cb, makeId());
    expect(banner).toEqual({ key: "upload.error.totalTooLarge" });
    expect(files).toHaveLength(0); // the pre-existing file is untouched, nothing new was added
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
