import { useEffect, useState } from "react";
import { REQUIRES_AUTH } from "@/shared/config/dataSource";
import { getSupabase } from "@/shared/lib/supabase";
import { queryClient } from "@/shared/api/queryClient";

export type AuthStatus = "loading" | "signed_in" | "signed_out";

/**
 * Tracks whether there is a session, for the gate in `app/_layout.tsx`.
 *
 * On mock data there is nothing to sign in to, so this reports `signed_in`
 * immediately and the auth screens are never reachable.
 */
export function useAuthStatus(): AuthStatus {
  const [status, setStatus] = useState<AuthStatus>(
    REQUIRES_AUTH ? "loading" : "signed_in",
  );

  useEffect(() => {
    if (!REQUIRES_AUTH) return;

    let active = true;
    const supabase = getSupabase();

    // Restores a persisted session before the first paint decision.
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setStatus(data.session ? "signed_in" : "signed_out");
    });

    // Covers sign-in, sign-out, token refresh, and expiry alike.
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      // Данные прошлого аккаунта не должны пережить выход: следующий вошедший
      // увидел бы чужие папки из кэша.
      if (event === "SIGNED_OUT") queryClient.clear();
      if (active) setStatus(session ? "signed_in" : "signed_out");
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return status;
}
