import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockSignOut = jest.fn<(options?: { scope?: string }) => Promise<{ error: unknown }>>();

jest.mock("./supabase", () => ({
  getSupabase: () => ({ auth: { signOut: mockSignOut } }),
}));

// eslint-disable-next-line import/first
import { signOut } from "./auth";

describe("signOut", () => {
  beforeEach(() => {
    mockSignOut.mockReset();
  });

  it("выходит везде, когда сервер ответил без ошибки", async () => {
    mockSignOut.mockResolvedValue({ error: null });
    await signOut();
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledWith();
  });

  it("сервер ответил ошибкой — выходит хотя бы на этом устройстве", async () => {
    mockSignOut
      .mockResolvedValueOnce({ error: new Error("session expired") })
      .mockResolvedValueOnce({ error: null });
    await signOut();
    expect(mockSignOut).toHaveBeenLastCalledWith({ scope: "local" });
  });

  it("сеть упала — тоже выходит на этом устройстве", async () => {
    mockSignOut
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ error: null });
    await signOut();
    expect(mockSignOut).toHaveBeenLastCalledWith({ scope: "local" });
  });

  it("не вышло и локально — ошибка для экрана", async () => {
    mockSignOut.mockResolvedValue({ error: new Error("nope") });
    await expect(signOut()).rejects.toMatchObject({ code: "sign_out_failed" });
  });
});
