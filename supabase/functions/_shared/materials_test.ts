/**
 *   cd supabase/functions && DENO_NO_PACKAGE_JSON=1 deno test --allow-env _shared/
 */
import { assertEquals } from "jsr:@std/assert@1";
import { strToU8, zipSync } from "npm:fflate@0.8.2";

import {
  checkLimits,
  docxText,
  INLINE_BUDGET_BYTES,
  pdfPageCount,
  splitInline,
  type StoredFile,
} from "./materials.ts";

const MB = 1024 * 1024;
const file = (mimeType: string, sizeBytes: number): StoredFile => ({
  path: "u/m/f",
  filename: "f",
  mimeType,
  sizeBytes,
});

Deno.test("лимиты: три файла в пределах — проходят", () => {
  assertEquals(
    checkLimits([file("image/jpeg", 2 * MB), file("application/pdf", 15 * MB), file("image/png", 1 * MB)]),
    null,
  );
});

Deno.test("лимиты: четвёртый файл и пустой набор — отказ", () => {
  assertEquals(checkLimits([]), "too_many_files");
  assertEquals(checkLimits(Array(4).fill(file("image/jpeg", MB))), "too_many_files");
});

Deno.test("лимиты: у каждого формата свой потолок", () => {
  assertEquals(checkLimits([file("image/jpeg", 10 * MB + 1)]), "file_too_large");
  assertEquals(checkLimits([file("application/pdf", 20 * MB + 1)]), "file_too_large");
  const docx = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  assertEquals(checkLimits([file(docx, 5 * MB + 1)]), "file_too_large");
  assertEquals(checkLimits([file(docx, 5 * MB)]), null);
});

Deno.test("лимиты: сумма больше 30 МБ — отказ, даже если каждый файл в пределах", () => {
  assertEquals(
    checkLimits([file("application/pdf", 18 * MB), file("application/pdf", 13 * MB)]),
    "total_too_large",
  );
});

Deno.test("лимиты: чужой тип — отказ", () => {
  assertEquals(checkLimits([file("text/plain", 100)]), "unsupported_type");
  assertEquals(checkLimits([file("image/webp", 100)]), "unsupported_type");
});

Deno.test("PDF: страницы считаются, узел дерева страниц — нет", () => {
  const pdf = new TextEncoder().encode(
    "%PDF-1.4\n1 0 obj << /Type /Pages /Count 3 >> endobj\n" +
      "2 0 obj << /Type /Page >> endobj\n3 0 obj << /Type/Page >> endobj\n" +
      "4 0 obj << /Type /Page /Parent 1 0 R >> endobj\n%%EOF",
  );
  assertEquals(pdfPageCount(pdf), 3);
});

Deno.test("DOCX: текст по абзацам, сущности раскрыты", () => {
  const xml = '<?xml version="1.0"?><w:document><w:body>' +
    "<w:p><w:r><w:t>第五课 在商店</w:t></w:r></w:p>" +
    "<w:p><w:r><w:t>你好&amp;再见</w:t></w:r><w:r><w:tab/><w:t>A &lt; B</w:t></w:r></w:p>" +
    "</w:body></w:document>";
  const docx = zipSync({ "word/document.xml": strToU8(xml), "[Content_Types].xml": strToU8("<x/>") });
  assertEquals(docxText(docx), "第五课 在商店\n你好&再见\tA < B");
});

Deno.test("DOCX: не zip и zip без документа — null", () => {
  assertEquals(docxText(new TextEncoder().encode("not a zip")), null);
  assertEquals(docxText(zipSync({ "other.xml": strToU8("<x/>") })), null);
});

Deno.test("инлайн: мелкие файлы идут в запрос, крупный — в Files API", () => {
  const small = { name: "a", bytes: new Uint8Array(2 * MB) };
  const medium = { name: "b", bytes: new Uint8Array(3 * MB) };
  const big = { name: "c", bytes: new Uint8Array(15 * MB) };
  const { inline, upload } = splitInline([big, small, medium]);
  assertEquals(inline.map((f) => f.name), ["a", "b"]);
  assertEquals(upload.map((f) => f.name), ["c"]);
});

Deno.test("инлайн: бюджет считается после base64", () => {
  // Ровно столько байт, чтобы base64 занял весь бюджет, — влезает; на байт больше — нет.
  const fits = { bytes: new Uint8Array((INLINE_BUDGET_BYTES / 4) * 3) };
  assertEquals(splitInline([fits]).inline.length, 1);
  const over = { bytes: new Uint8Array((INLINE_BUDGET_BYTES / 4) * 3 + 1) };
  assertEquals(splitInline([over]).upload.length, 1);
});
