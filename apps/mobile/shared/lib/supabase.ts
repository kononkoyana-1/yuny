import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@yuny/shared";
import { Platform } from "react-native";

/**
 * The single Supabase client (TZ.md §6 — no component ever touches it
 * directly; only repositories do). Configuration is public by design: the
 * publishable key grants nothing on its own, every table is behind RLS.
 *
 * Built lazily on first use, not at import time: `shared/repositories`
 * imports both the mock and the Supabase branch statically, so constructing
 * the client eagerly would make a missing `EXPO_PUBLIC_SUPABASE_URL` crash
 * the app even when running on mock data.
 */
let client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (client) return client;

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY must be set to run with EXPO_PUBLIC_DATA_SOURCE=supabase.",
    );
  }

  client = createClient<Database>(url, key, {
    auth: {
      // Web already persists to localStorage; native needs an explicit store.
      storage: Platform.OS === "web" ? undefined : AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // On web the OAuth provider hands the tokens back on the return URL
      // and supabase-js has to read them; native never gets a URL callback
      // (see `signInWithGoogle`, which sets the session by hand).
      detectSessionInUrl: Platform.OS === "web",
    },
  });
  return client;
}
