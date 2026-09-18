import { describe, expect, it } from "@jest/globals";
import { errorRoute, needsFreshMaterialId, type ErrorPhase, type FailureKind } from "./errorRoute";

/**
 * Row-by-row unit test for `errorRoute.ts` against `docs/design/specs/upload.design.md`
 * §2's routing table (Acceptance #17; design review round 1 flagged the
 * missing test, round 2 decision 1 adds it). Every `(phase, code)` pair
 * listed in the spec table is its own row here, plus one unknown code per
 * phase to pin down each phase's fallback `FailureKind`.
 */
const CASES: [ErrorPhase, string, FailureKind][] = [
  // sending (Storage upload) — any code, always send_failed.
  ["upload", "upload_failed", "send_failed"],
  ["upload", "network_error", "send_failed"],

  // sending (module-create) — limits.
  ["create", "too_many_files", "limits"],
  ["create", "file_too_large", "limits"],
  ["create", "total_too_large", "limits"],
  ["create", "unsupported_type", "limits"],

  // sending (module-create) — send_failed, including every named code and one unknown.
  ["create", "file_missing", "send_failed"],
  ["create", "network_error", "send_failed"],
  ["create", "internal_error", "send_failed"],
  ["create", "empty_response", "send_failed"],
  ["create", "module_create_failed", "send_failed"],
  ["create", "storage_unavailable", "send_failed"],
  ["create", "invalid_request", "send_failed"],
  ["create", "some_future_code", "send_failed"],

  // reading (job).
  ["job", "not_language_material", "material_rejected"],
  ["job", "pdf_too_many_pages", "pdf_too_long"],
  ["job", "ai_unavailable", "parse_failed"],
  ["job", "ai_invalid_response", "parse_failed"],
  ["job", "internal_error", "parse_failed"],
  ["job", "some_future_code", "parse_failed"],
  ["job", "timeout", "parse_slow"],
  ["job", "realtime_unavailable", "parse_slow"],
  ["job", "file_missing", "lost"],

  // retry (module-parse).
  ["retry", "module_not_found", "lost"],
  ["retry", "module_not_retryable", "lost"],
  ["retry", "network_error", "parse_failed"],
  ["retry", "some_future_code", "parse_failed"],
];

describe("errorRoute", () => {
  it.each(CASES)("(%s, %s) -> %s", (phase: ErrorPhase, code: string, expected: FailureKind) => {
    expect(errorRoute(phase, code)).toBe(expected);
  });
});

describe("needsFreshMaterialId", () => {
  it("is true for limits regardless of code", () => {
    expect(needsFreshMaterialId("limits", "too_many_files")).toBe(true);
    expect(needsFreshMaterialId("limits", "unsupported_type")).toBe(true);
  });

  it("is true for lost regardless of code", () => {
    expect(needsFreshMaterialId("lost", "file_missing")).toBe(true);
    expect(needsFreshMaterialId("lost", "module_not_found")).toBe(true);
  });

  it("is true for send_failed only when caused by file_missing", () => {
    expect(needsFreshMaterialId("send_failed", "file_missing")).toBe(true);
    expect(needsFreshMaterialId("send_failed", "network_error")).toBe(false);
    expect(needsFreshMaterialId("send_failed", "internal_error")).toBe(false);
  });

  it("is false for every other FailureKind", () => {
    expect(needsFreshMaterialId("material_rejected", "not_language_material")).toBe(false);
    expect(needsFreshMaterialId("pdf_too_long", "pdf_too_many_pages")).toBe(false);
    expect(needsFreshMaterialId("parse_failed", "ai_unavailable")).toBe(false);
    expect(needsFreshMaterialId("parse_slow", "timeout")).toBe(false);
  });
});
