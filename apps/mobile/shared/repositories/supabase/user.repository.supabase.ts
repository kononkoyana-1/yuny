import { ProfileSchema } from "@yuny/shared";
import { BackendError } from "@/shared/lib/backendError";
import { requireUserId } from "@/shared/lib/auth";
import { invokeEdge } from "@/shared/lib/edge";
import { getSupabase } from "@/shared/lib/supabase";
import type { ProfileUpdateInput, UserRepository } from "../user.repository";

/**
 * `profiles` is the one table the client may write to directly (TZ.md §5 —
 * SELECT + UPDATE of its own row); RLS scopes both to `auth.uid()`. The row
 * itself is created by a signup trigger, so it always exists by the time the
 * first screen asks for it.
 */
export const supabaseUserRepository: UserRepository = {
  async getProfile() {
    const userId = await requireUserId();
    const { data, error } = await getSupabase()
      .from("profiles")
      .select("id, display_name, created_at")
      .eq("id", userId)
      .single();

    if (error || !data) throw new BackendError("profile_not_found");
    return ProfileSchema.parse(data);
  },

  async updateProfile(patch: ProfileUpdateInput) {
    const userId = await requireUserId();
    const { data, error } = await getSupabase()
      .from("profiles")
      .update(patch)
      .eq("id", userId)
      .select("id, display_name, created_at")
      .single();

    if (error || !data) throw new BackendError("profile_update_failed");
    return ProfileSchema.parse(data);
  },

  async getEmail() {
    const { data } = await getSupabase().auth.getSession();
    return data.session?.user.email ?? null;
  },

  async deleteAccount() {
    await invokeEdge<unknown>("account-delete", { confirm: "delete" });
    // Пользователя на сервере уже нет, выход на сервере вернул бы ошибку —
    // убираем только локальную сессию; AuthGate уведёт на экран входа.
    await getSupabase().auth.signOut({ scope: "local" });
  },
};
