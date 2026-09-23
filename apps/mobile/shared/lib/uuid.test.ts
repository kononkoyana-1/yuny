import { describe, expect, it, jest } from "@jest/globals";
import { randomBytes as mockRandomBytes } from "node:crypto";

import { uuid } from "./uuid";

// Настоящие случайные байты из Node вместо нативного модуля: проверяется
// сборка UUID, а не генератор. `jest.mock` поднимается над импортами сам.
jest.mock("expo-crypto", () => ({
  getRandomBytes: (n: number) => new Uint8Array(mockRandomBytes(n)),
}));

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("uuid", () => {
  it("даёт UUID версии 4 варианта RFC 4122 — его примет z.uuid() на сервере", () => {
    for (let i = 0; i < 200; i += 1) expect(uuid()).toMatch(V4);
  });

  it("не повторяется", () => {
    const seen = new Set(Array.from({ length: 1000 }, () => uuid()));
    expect(seen.size).toBe(1000);
  });
});
