import type { PropsWithChildren } from "react";
import { ScrollViewStyleReset } from "expo-router/html";
import { colors } from "@/shared/config/tokens";

/**
 * The web-only HTML shell. Expo Router renders every web page inside this
 * document; it never runs on iOS or Android, which is why platform-specific
 * CSS may live here without going through `shared/platform/` (TZ.md §4 is
 * about branching on `Platform.OS` in shared code, not about a file the
 * native targets never load).
 *
 * The one thing it adds beyond the default shell is an autofill override.
 * When a browser fills a saved email or password it paints the field with its
 * own highlight — orange in Edge and Firefox, pale blue in Chrome — and that
 * colour cannot be changed with `background-color`: the browser's rule wins.
 * A large inset `box-shadow` is the only way to cover it, and
 * `-webkit-text-fill-color` the only way to restore the text colour, which
 * the same rule overrides.
 *
 * The very long `transition` delay is the standard companion trick: Chrome
 * repaints the highlight shortly after fill, and a transition it can never
 * reach keeps our colour on screen instead.
 *
 * Values come from `tokens.ts` rather than being written out, so a palette
 * change moves this with it (TZ.md §12 — no loose hex).
 */
const autofillCss = `
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active,
textarea:-webkit-autofill,
select:-webkit-autofill {
  -webkit-box-shadow: 0 0 0 1000px ${colors.light.surface} inset !important;
  box-shadow: 0 0 0 1000px ${colors.light.surface} inset !important;
  -webkit-text-fill-color: ${colors.light.text} !important;
  caret-color: ${colors.light.text};
  transition: background-color 100000s ease-in-out 0s;
}

/* Firefox names the state differently and does honour a plain background. */
input:autofill,
textarea:autofill {
  background-color: ${colors.light.surface} !important;
  color: ${colors.light.text} !important;
}

/* DS-T: dark styling here follows the ".dark" class the pre-hydration
   script (below) and \`themePreference.ts\` put on <html> — not
   "prefers-color-scheme" — since \`darkMode: "class"\` means the app's theme
   is the user's stored choice, not always the OS setting. */
html.dark input:-webkit-autofill,
html.dark input:-webkit-autofill:hover,
html.dark input:-webkit-autofill:focus,
html.dark input:-webkit-autofill:active,
html.dark textarea:-webkit-autofill,
html.dark select:-webkit-autofill {
  -webkit-box-shadow: 0 0 0 1000px ${colors.dark.surface} inset !important;
  box-shadow: 0 0 0 1000px ${colors.dark.surface} inset !important;
  -webkit-text-fill-color: ${colors.dark.text} !important;
  caret-color: ${colors.dark.text};
}

html.dark input:autofill,
html.dark textarea:autofill {
  background-color: ${colors.dark.surface} !important;
  color: ${colors.dark.text} !important;
}

/* The document behind the app, so a bounce or an over-scroll never exposes
   the browser's white. Same reason contentStyle is set on the Stack. */
html, body {
  background-color: ${colors.light.background};
}

html.dark, html.dark body {
  background-color: ${colors.dark.background};
}
`;

/**
 * Runs before React hydrates (a plain <script> tag in <head> executes during
 * HTML parsing). Reads the stored theme choice the same way
 * `shared/lib/themePreference.ts` does (`localStorage["yuny.theme"]`, one of
 * "light" | "dark" | absent-means-system) and applies the `dark` class and
 * `color-scheme` style on <html> synchronously, so the first paint of a
 * static web export is already in the right theme instead of flashing light
 * and then re-applying dark after hydration (DS-T, settings.design.md §9).
 *
 * try/catch: `localStorage` throws in some privacy modes (Safari private
 * browsing, cookies-blocked). Falling through to `system` there matches
 * `themePreference.ts`'s own fallback.
 */
const themeScript = `
(function () {
  try {
    var stored = window.localStorage.getItem("yuny.theme");
    var isDark = stored === "dark"
      || (stored !== "light" && window.matchMedia
        && window.matchMedia("(prefers-color-scheme: dark)").matches);
    var root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    root.style.colorScheme = isDark ? "dark" : "light";
  } catch (e) {}
})();
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        {/*
          Required by Expo Router on web: without it the root ScrollView grows
          the document instead of scrolling inside its own box.
        */}
        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: autofillCss }} />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
