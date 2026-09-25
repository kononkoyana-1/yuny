/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./shared/**/*.{ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // #65 (today-session.design.md V.7): sочнее prior #6B5AC9/#9B8FE3.
        // Mirrors `colors.{light,dark}.primary` in shared/config/tokens.ts.
        primary: "#5B3DF5",
        "primary-dark": "#8F7BFF",
        "primary-soft": "#ECE8FF",
        "primary-soft-dark": "#2A2256",
        // `ProgressRing`'s track; mirrors `colors.{light,dark}.ringTrack` in
        // shared/config/tokens.ts — see there for the contrast math.
        "ring-track": "#D8CCF0",
        "ring-track-dark": "#3A3260",
        accent: "#FFD764",
        "accent-soft": "#FCF3E8",
        "accent-soft-dark": "#31294A",
        info: "#6BC0EC",
        // #65 V.7: fill/icons only — text uses `success-ink`.
        success: "#0F9D6B",
        "success-dark": "#34D399",
        warning: "#E8A54B",
        danger: "#D96A6A",
        "danger-dark": "#E58585",
        // Settings (#40, settings.design.md «Новые токены»); mirrors
        // `colors.{light,dark}.destructive{,Soft}` in shared/config/tokens.ts.
        destructive: "#B4232F",
        "destructive-dark": "#FF8A8A",
        "destructive-soft": "#FFEEF0",
        "destructive-soft-dark": "#3A1620",
        // #65 V.7: almost-white, cool; dark is deeper so the hero gradient
        // and the stage scale glow against it.
        background: "#F6F5FB",
        "background-dark": "#0F0C1D",
        surface: "#FFFFFF",
        "surface-dark": "#1A1630",
        "surface-alt": "#EEECF6",
        "surface-alt-dark": "#231E3D",
        border: "#E3E0F0",
        "border-dark": "#2E2850",
        text: "#1A1433",
        "text-dark": "#F4F1FF",
        "text-muted": "#5F5A7A",
        "text-muted-dark": "#ABA4C9",
        "text-inverse": "#FFFFFF",
        "text-inverse-dark": "#0F0C1D",
        // Raised-surface shadow; mirrors `shadowColor` in shared/config/tokens.ts.
        shadow: "#3C2D78",
        // `Sheet`'s dimming layer; mirrors `colors.{light,dark}.scrim` in
        // shared/config/tokens.ts — see there for why each alpha differs.
        scrim: "#3C2D7899",
        "scrim-dark": "#100E20CC",

        // --- #65 V.7 (today-session.design.md): new tokens ----------------
        // Mirrors the matching keys under `colors.{light,dark}` in
        // shared/config/tokens.ts — see there for the contrast math.
        "success-ink": "#0B7A53",
        "success-ink-dark": "#6EE7B7",
        "success-soft": "#E3F7EE",
        "success-soft-dark": "#0F2E26",
        attention: "#C2620A",
        "attention-dark": "#FFB547",
        "attention-ink": "#B45309",
        "attention-ink-dark": "#FFC46B",
        "attention-soft": "#FFF1DC",
        "attention-soft-dark": "#3A2710",
        pair: "#D6336C",
        "pair-dark": "#FF6B9E",
        "pair-ink": "#B4235A",
        "pair-ink-dark": "#FF8FB8",
        "pair-soft": "#FFE3EE",
        "pair-soft-dark": "#3A1530",
        "hero-ink": "#FFFFFF",
        "hero-ink-dark": "#FFFFFF",
        "hero-ink-muted": "#E9E4FF",
        "hero-ink-muted-dark": "#EDE9FF",
        "hero-action": "#FFFFFF",
        "hero-action-dark": "#F4F1FF",
        "hero-action-ink": "#5B3DF5",
        "hero-action-ink-dark": "#4A2DDB",
        "focus-ring": "#5B3DF5",
        "focus-ring-dark": "#C4B8FF",
        // Stage scale — dark theme is inverted, step 1 is the darkest tile.
        "stage-new": "#FFFFFF",
        "stage-new-dark": "#1A1630",
        "stage-meeting": "#EEE9FF",
        "stage-meeting-dark": "#2A2350",
        "stage-recognize": "#D6CCFF",
        "stage-recognize-dark": "#3D3278",
        "stage-recall": "#A391FF",
        "stage-recall-dark": "#5A48B8",
        "stage-use": "#6A4DF2",
        "stage-use-dark": "#8C7AF5",
        "stage-stable": "#4A2BD6",
        "stage-stable-dark": "#C4B8FF",
        "on-stage-light": "#1A1433",
        "on-stage-light-dark": "#F4F1FF",
        "on-stage-deep": "#FFFFFF",
        "on-stage-deep-dark": "#0F0C1D",
        "stage-edge": "#C9C3E0",
        "stage-edge-dark": "#4A4270",
        "stage-stable-mark": "#FFC53D",
        "stage-stable-mark-dark": "#0F0C1D",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        xxl: "48px",
        // Component sizes, not gap/padding rhythm — mirrors `sizing` in
        // shared/config/tokens.ts. Extending `spacing` (rather than `width`/
        // `height` alone) is what makes both `w-*` and `h-*` pick these up,
        // since Tailwind's default width/height scale reads from `spacing`.
        "module-circle": "80px",
        "module-cell": "112px",
        "ring-stroke": "4px",
        "ring-gap": "4px",
        // `Monogram`'s diameter (#40); mirrors `sizing.avatar`.
        avatar: "64px",

        // --- #65 V.7: `sizing.tapTarget` — use `min-h-tap`/`h-tap`/`w-tap` ---
        tap: "44px",
        // "Сегодня" hero `ProgressRing`.
        "today-ring": "64px",
        // Pause/day-summary column, wide breakpoint.
        "reading-column": "560px",
        // Left ("Сегодня") column, wide "Словарь" layout.
        "hero-column": "400px",
        "focus-ring-width": "3px",

        // --- exercise.design.md §9 ------------------------------------------
        "exercise-column": "640px",
        "option-min-height": "64px",
        "hanzi-choice": "88px",
        "progress-height": "10px",

        // --- folder-study.design.md §8 --------------------------------------
        "study-button": "72px",

        // --- folder-map.design.md §8 -----------------------------------------
        "word-tile": "106px",
        "due-border": "2px",
        "stage-bar": "12px",
        "stage-bar-mini": "6px",
        "skill-pip": "6px",
        "folder-card-min": "280px",
      },
      maxWidth: {
        // `Sheet`'s panel width on `breakpoints.wide` and up; mirrors
        // `sizing.sheetMaxWidth` in shared/config/tokens.ts.
        sheet: "480px",
        // Settings (#40) single-column width; mirrors `sizing.settingsColumn`.
        "settings-column": "640px",
      },
      screens: {
        // Mirrors `breakpoints.wide` in shared/config/tokens.ts. Numerically
        // identical to Tailwind's built-in `md` (both 768px) — named
        // separately so a `wide:` class reads as "the Home/Sheet breakpoint"
        // rather than an arbitrary Tailwind size step.
        wide: "768px",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        card: "22px",
        xl: "24px",
        pill: "999px",
        // #65 V.7: `OptionTile`/`WordTile`/other answer/word tiles.
        tile: "18px",
        // #65 V.7: `HeroCard`, `AnswerTray`.
        hero: "32px",
      },
      // #65 V.7: `elevation.raised` / `elevation.glow` in shared/config/tokens.ts.
      // `raised` matches the shadow `Card` already computes inline
      // (`shadow-shadow/10` ≈ 0.08 alpha); `glow` is the coloured shadow
      // under `HeroCard`/`AnswerTray`, dark reading as a glow per V.5/V.6.
      boxShadow: {
        raised: "0px 2px 8px 0px rgba(60, 45, 120, 0.08)",
        glow: "0px 16px 40px 0px rgba(91, 61, 245, 0.28)",
        "glow-dark": "0px 16px 48px 0px rgba(143, 123, 255, 0.22)",
      },
      // Each weight is its own file: React Native will not synthesise one
      // face into another. Mirrors `fontFamily` in shared/config/tokens.ts.
      //
      // #65 V.2/V.7 (DS13): Inter replaces Plus Jakarta Sans (Cyrillic +
      // full pinyin-tone coverage, see the comment on `fontFamily` in
      // tokens.ts). `hanzi-*` backs `HanziText` (Noto Sans SC, OFL).
      fontFamily: {
        regular: ["Inter_400Regular"],
        medium: ["Inter_500Medium"],
        semibold: ["Inter_600SemiBold"],
        bold: ["Inter_700Bold"],
        extrabold: ["Inter_800ExtraBold"],
        "hanzi-regular": ["NotoSansSC_400Regular"],
        "hanzi-medium": ["NotoSansSC_500Medium"],
        "hanzi-bold": ["NotoSansSC_700Bold"],
      },
      // Mirrors `typography` in shared/config/tokens.ts — see there for why
      // tracking tightens as size grows.
      fontSize: {
        display: ["34px", { lineHeight: "40px", fontWeight: "800", letterSpacing: "-1px" }],
        title: ["24px", { lineHeight: "30px", fontWeight: "800", letterSpacing: "-0.6px" }],
        heading: ["18px", { lineHeight: "24px", fontWeight: "700", letterSpacing: "-0.3px" }],
        body: ["16px", { lineHeight: "24px", fontWeight: "400" }],
        caption: ["13px", { lineHeight: "18px", fontWeight: "500" }],

        // --- #65 V.7/V.3: new sizes, `fontFamily.ui` -------------------------
        "number-hero": ["56px", { lineHeight: "60px", fontWeight: "800", letterSpacing: "-1.5px" }],
        eyebrow: ["12px", { lineHeight: "16px", fontWeight: "700", letterSpacing: "1.2px" }],
        "pinyin-hero": ["24px", { lineHeight: "30px", fontWeight: "500" }],

        // --- #65 V.7/V.3: hanzi type scale, `fontFamily.hanzi` ---------------
        // Read only by `HanziText` (DS5) — plain `Text` has no variant for these.
        "hanzi-hero": ["96px", { lineHeight: "116px", fontWeight: "500" }],
        "hanzi-hero-long": ["64px", { lineHeight: "80px", fontWeight: "500" }],
        "hanzi-option": ["40px", { lineHeight: "52px", fontWeight: "500" }],
        "hanzi-sentence": ["28px", { lineHeight: "44px", fontWeight: "400" }],
        "hanzi-tile": ["30px", { lineHeight: "38px", fontWeight: "500" }],
        "hanzi-inline": ["20px", { lineHeight: "28px", fontWeight: "500" }],
      },
      // #65 V.7 (exercise.design.md §9): `opacity.dimmed` — an `OptionTile`
      // that is neither the chosen nor the correct answer once one is in.
      opacity: {
        dimmed: "0.6",
      },
    },
  },
  plugins: [],
};
