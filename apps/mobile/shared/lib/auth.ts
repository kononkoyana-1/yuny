import * as AppleAuthentication from "expo-apple-authentication";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { BackendError } from "./backendError";
import { getSupabase } from "./supabase";

/**
 * Authentication (screen 00). Yuny is unusable signed out — every table is
 * owned by `auth.uid()` — so the root layout gates the whole app behind
 * this, and repositories can assume a session exists.
 *
 * Three ways in: email + password, Google, and Apple. Google runs through
 * Supabase's own OAuth callback rather than per-platform native SDKs, so the
 * project needs one Google client configured in the dashboard instead of
 * three; Apple uses the native sheet on iOS because App Store review
 * requires it whenever a third-party sign-in is offered.
 */

/** Apple's native sheet only exists on iOS. */
export const APPLE_SIGN_IN_AVAILABLE = Platform.OS === "ios";

/** Google is hidden until the project actually has a Google client wired up. */
export const GOOGLE_SIGN_IN_AVAILABLE =
  process.env.EXPO_PUBLIC_GOOGLE_SIGN_IN === "enabled";

/**
 * The deployed web app's own address (`https://…/yuny/`), or `undefined`
 * outside the Pages build. `Linking.createURL` does not know the site's
 * base path, so auth redirects on the deployed site use this instead.
 */
const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL || undefined;

/** Turns Supabase's auth errors into the same `{ code }` shape as the backend. */
function authFailure(message: string | undefined): BackendError {
  const text = (message ?? "").toLowerCase();
  if (text.includes("invalid login credentials")) return new BackendError("invalid_credentials");
  if (text.includes("email not confirmed")) return new BackendError("email_not_confirmed");
  if (text.includes("already registered")) return new BackendError("email_taken");
  if (text.includes("password")) return new BackendError("weak_password");
  if (text.includes("rate limit")) return new BackendError("too_many_attempts");
  return new BackendError("sign_in_failed");
}

export interface EmailCredentials {
  email: string;
  password: string;
}

export async function signInWithEmail({ email, password }: EmailCredentials): Promise<void> {
  const { error } = await getSupabase().auth.signInWithPassword({ email, password });
  if (error) throw authFailure(error.message);
}

/**
 * Returns `true` when Supabase created a session immediately, `false` when
 * the account still needs an emailed confirmation — the caller routes to the
 * "check your email" screen in that case.
 */
export async function signUpWithEmail(
  { email, password }: EmailCredentials,
  displayName: string,
): Promise<boolean> {
  const { data, error } = await getSupabase().auth.signUp({
    email,
    password,
    options: {
      // Read by the `handle_new_user` trigger to seed `profiles.display_name`.
      data: { display_name: displayName },
      // Where the confirmation email's link lands. Without it Supabase uses
      // the project's Site URL, which is not the deployed site. Set only by
      // the Pages build (`.github/workflows/pages.yml`), whose address is also
      // added to the project's allowed redirects there.
      ...(SITE_URL ? { emailRedirectTo: SITE_URL } : {}),
    },
  });
  if (error) throw authFailure(error.message);
  return Boolean(data.session);
}

export async function signInWithGoogle(): Promise<void> {
  const supabase = getSupabase();
  // Web comes back to the app root and lets supabase-js read the tokens off
  // the URL (`detectSessionInUrl`); native has no such hook, so it returns to
  // a path that only `openAuthSessionAsync` ever sees.
  const redirectTo =
    Platform.OS === "web" ? (SITE_URL ?? Linking.createURL("/")) : Linking.createURL("/auth-callback");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: Platform.OS !== "web" },
  });
  if (error || !data.url) throw authFailure(error?.message);

  // On web the call above already navigated away and supabase-js will
  // restore the session on the way back; native opens the system browser and
  // hands the tokens back on the redirect URL's fragment.
  if (Platform.OS === "web") return;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") throw new BackendError("sign_in_cancelled");

  const fragment = result.url.split("#")[1] ?? "";
  const params = new URLSearchParams(fragment);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (!access_token || !refresh_token) throw new BackendError("sign_in_failed");

  const { error: sessionError } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (sessionError) throw authFailure(sessionError.message);
}

export async function signInWithApple(): Promise<void> {
  if (!APPLE_SIGN_IN_AVAILABLE) throw new BackendError("apple_unavailable");

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch {
    // The user dismissing the sheet is a normal outcome, not an error state.
    throw new BackendError("sign_in_cancelled");
  }

  if (!credential.identityToken) throw new BackendError("sign_in_failed");

  const { error } = await getSupabase().auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
  });
  if (error) throw authFailure(error.message);
}

/**
 * Выход. Сначала — везде (сервер отзывает сессию). Если сервер ответил
 * ошибкой (нет сети, сессия уже истекла, аккаунт удалён), supabase-js
 * оставляет локальную сессию как есть, и кнопка «Выйти» выглядела бы
 * неработающей — поэтому тогда выходим хотя бы на этом устройстве.
 */
export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut().catch((e: unknown) => ({ error: e }));
  if (error) {
    const local = await supabase.auth.signOut({ scope: "local" });
    if (local.error) throw new BackendError("sign_out_failed");
  }
}

/**
 * The signed-in user's id. Repositories call this instead of reading the
 * session directly; it throws only if something has gone wrong with the
 * gate, since no screen behind it renders without a session.
 */
export async function requireUserId(): Promise<string> {
  const { data } = await getSupabase().auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) throw new BackendError("unauthorized");
  return userId;
}
