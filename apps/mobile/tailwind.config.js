/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "media",
  content: [
    "./app/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./shared/**/*.{ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#6B5AC9",
        "primary-dark": "#9B8FE3",
        "primary-soft": "#EFECFB",
        "primary-soft-dark": "#2B2547",
        accent: "#FFD764",
        "accent-soft": "#FCF3E8",
        "accent-soft-dark": "#31294A",
        info: "#6BC0EC",
        success: "#4A9B6E",
        "success-dark": "#5FB584",
        warning: "#E8A54B",
        danger: "#D96A6A",
        "danger-dark": "#E58585",
        background: "#F1EFFC",
        "background-dark": "#17142A",
        surface: "#FFFFFF",
        "surface-dark": "#221E3B",
        "surface-alt": "#F5F3FE",
        "surface-alt-dark": "#2B2547",
        border: "#E8E4F8",
        "border-dark": "#332D52",
        text: "#241F3D",
        "text-dark": "#F2EFF8",
        "text-muted": "#6E6890",
        "text-muted-dark": "#A9A2C4",
        "text-inverse": "#FFFFFF",
        "text-inverse-dark": "#17142A",
        // Raised-surface shadow; mirrors `shadowColor` in shared/config/tokens.ts.
        shadow: "#3C2D78",
        // `Sheet`'s dimming layer; mirrors `colors.{light,dark}.scrim` in
        // shared/config/tokens.ts — see there for why each alpha differs.
        scrim: "#3C2D7899",
        "scrim-dark": "#100E20CC",
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
      },
      maxWidth: {
        // `Sheet`'s panel width on `breakpoints.wide` and up; mirrors
        // `sizing.sheetMaxWidth` in shared/config/tokens.ts.
        sheet: "480px",
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
      },
      // Each weight is its own file: React Native will not synthesise one
      // face into another. Mirrors `fontFamily` in shared/config/tokens.ts.
      fontFamily: {
        regular: ["PlusJakartaSans-Regular"],
        medium: ["PlusJakartaSans-Medium"],
        semibold: ["PlusJakartaSans-SemiBold"],
        bold: ["PlusJakartaSans-Bold"],
        extrabold: ["PlusJakartaSans-ExtraBold"],
      },
      // Mirrors `typography` in shared/config/tokens.ts — see there for why
      // tracking tightens as size grows.
      fontSize: {
        display: ["34px", { lineHeight: "40px", fontWeight: "800", letterSpacing: "-1px" }],
        title: ["24px", { lineHeight: "30px", fontWeight: "800", letterSpacing: "-0.6px" }],
        heading: ["18px", { lineHeight: "24px", fontWeight: "700", letterSpacing: "-0.3px" }],
        body: ["16px", { lineHeight: "24px", fontWeight: "400" }],
        caption: ["13px", { lineHeight: "18px", fontWeight: "500" }],
      },
    },
  },
  plugins: [],
};
