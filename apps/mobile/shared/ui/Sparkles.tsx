import { View } from "react-native";
import StarGoldMd from "@/assets/star/star-gold-md.svg";
import StarGoldSm from "@/assets/star/star-gold-sm.svg";
import StarVioletLg from "@/assets/star/star-violet-lg.svg";
import StarVioletMd from "@/assets/star/star-violet-md.svg";

/**
 * The four-point sparkles scattered across the entry screen.
 *
 * Four source files, not one repeated glyph: two violet and two gold, each
 * with its own proportions. A single star reused at eight sizes reads as a
 * CSS pattern — the variety is what makes the screen feel drawn rather than
 * generated.
 *
 * Colour is baked into the paths (`#6B5AC9` and `#F3E7A5`), so nothing here
 * passes `fill`. That is deliberate: these are illustration, not iconography,
 * and the violet already matches `primary` exactly.
 *
 * Static, with no animation. The mascot is the one thing on this screen that
 * moves; eight looping sparkles behind it would compete with both the mascot
 * and the CTA, and TZ.md §12 asks for calm everywhere the mascot is not.
 */
const GLYPHS = {
  violetLg: StarVioletLg,
  violetMd: StarVioletMd,
  goldMd: StarGoldMd,
  goldSm: StarGoldSm,
} as const;

interface Placement {
  glyph: keyof typeof GLYPHS;
  /** Percent of the frame, so the scatter holds at any screen size. */
  left?: `${number}%`;
  right?: `${number}%`;
  top: `${number}%`;
  size: number;
  opacity: number;
}

/**
 * Positions follow the reference: a large violet star above and right of the
 * wordmark, then progressively smaller ones down both edges, thinning out
 * toward the bottom so nothing crowds the CTA. Nothing sits over the middle
 * band where the mascot's face falls.
 */
const PLACEMENTS: Placement[] = [
  // Tucked against the wordmark, as in the reference — and clear of the
  // language switcher, which owns the top-right corner from ~4% to ~9%.
  { glyph: "violetLg", right: "26%", top: "12%", size: 24, opacity: 0.9 },
  { glyph: "goldSm", left: "11%", top: "15%", size: 13, opacity: 0.7 },
  { glyph: "violetMd", left: "6%", top: "34%", size: 16, opacity: 0.5 },
  { glyph: "goldMd", right: "7%", top: "30%", size: 19, opacity: 0.65 },
  { glyph: "goldSm", left: "15%", top: "52%", size: 11, opacity: 0.55 },
  { glyph: "violetMd", right: "11%", top: "49%", size: 14, opacity: 0.45 },
  { glyph: "goldMd", left: "8%", top: "68%", size: 15, opacity: 0.4 },
  { glyph: "violetLg", right: "21%", top: "72%", size: 10, opacity: 0.35 },
];

export function Sparkles() {
  return (
    <View
      pointerEvents="none"
      className="absolute inset-0"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {PLACEMENTS.map((star, index) => {
        const Glyph = GLYPHS[star.glyph];
        return (
          <View
            key={`${star.glyph}-${index}`}
            style={{
              position: "absolute",
              top: star.top,
              left: star.left,
              right: star.right,
              opacity: star.opacity,
            }}
          >
            <Glyph width={star.size} height={star.size} />
          </View>
        );
      })}
    </View>
  );
}
