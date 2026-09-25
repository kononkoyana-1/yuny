/**
 * Single source of truth for design tokens.
 *
 * Mirrors apps/mobile/tailwind.config.js exactly — any value changed here
 * must be changed there too (and vice versa). NativeWind className usage
 * reads from tailwind.config.js; this file is for the rare non-className
 * case (Reanimated shared values, SVG props, chart colors) where a raw
 * value is required instead of a class name.
 */

export const colors = {
  light: {
    /**
     * #65 (today-session.design.md V.7): sочнее prior #6B5AC9. White text on
     * it is 6.12:1.
     */
    primary: "#5B3DF5",
    /** #65 V.7: `primary` on this backdrop is 5.12:1. */
    primarySoft: "#ECE8FF",
    /**
     * `ProgressRing`'s track (home.design.md v2, §Theming). `primarySoft`
     * itself only reaches 1.02:1 against `background` — at 0/N progress the
     * ring was invisible (home.review.md S1). #D8CCF0 stays in the same
     * primary-tinted lavender family, one step darker than `primarySoft`,
     * and clears the spec's 1.25:1 floor at 1.34:1 while staying visibly
     * quieter than the `primary` arc it surrounds.
     */
    ringTrack: "#D8CCF0",
    accent: "#FFD764",
    /**
     * Softened toward neutral from #FFF6DC. The accent itself stays gold —
     * it comes from the mascot's star — but a saturated cream pill read as a
     * stray warm patch once the background moved to lavender.
     */
    accentSoft: "#FCF3E8",
    info: "#6BC0EC",
    /** #65 V.7: ≥ 3.2:1 to `background`. Fill/icons only — text uses `successInk`. */
    success: "#0F9D6B",
    warning: "#E8A54B",
    danger: "#D96A6A",
    /**
     * Settings (#40, settings.design.md «Новые токены»): destructive action
     * role — «Удалить аккаунт» label/glyph, the confirmation panel's text,
     * `Button variant="destructive"`'s fill. Distinct from `danger` (3.2:1
     * on white, not usable for text): this is 6.52:1 as text on `surface`.
     * `danger` stays unused by this role, per the spec.
     */
    destructive: "#B4232F",
    /** Backdrop for the "нельзя отменить" panel; `destructive` on it is 5.82:1. */
    destructiveSoft: "#FFEEF0",
    /** #65 V.7: almost-white, cool. Deep enough for `gradients.hero` to glow against. */
    background: "#F6F5FB",
    surface: "#FFFFFF",
    /** #65 V.7: "утопленная" поверхность — C2 tile bank, stage-track backdrop. */
    surfaceAlt: "#EEECF6",
    border: "#E3E0F0",
    /** #65 V.7: 16.26:1 on `background`. */
    text: "#1A1433",
    /** #65 V.7: ≥ 5.56:1 on `surfaceAlt`. */
    textMuted: "#5F5A7A",
    textInverse: "#FFFFFF",
    /**
     * `Sheet`'s full-screen dimming layer (home.design.md §Composition, new
     * primitives). Built from `shadowColor` — the same violet-tinted
     * near-black already used for raised-surface shadows — rather than a
     * plain black, so the scrim sits in the same colour family as the rest
     * of the theme instead of reading as generic grey. 60% alpha (`#99`)
     * lets `surface` separate from the page behind it with no shadow of its
     * own, per the spec's requirement.
     */
    scrim: "#3C2D7899",

    // --- #65 V.7: new tokens ---------------------------------------------
    /** Text on `successSoft`, 4.79:1. "Верно" heading, correct-answer copy. */
    successInk: "#0B7A53",
    /** Correct-answer tray/tile fill. */
    successSoft: "#E3F7EE",
    /** "Пора освежить" dashed border, soft-review outline. 3.84:1 to `background`. */
    attention: "#C2620A",
    /** Text on `attentionSoft`, 4.51:1. */
    attentionInk: "#B45309",
    /** Soft-review tray/debt banner fill. */
    attentionSoft: "#FFF1DC",
    /** Confusion-pair marker/accent. 4.62:1 to `surface`. */
    pair: "#D6336C",
    /** Text on `pairSoft`, 5.25:1. */
    pairInk: "#B4235A",
    /** Confusion-pair label backdrop. */
    pairSoft: "#FFE3EE",
    /** Text on `gradients.hero`, ≥ 5.9:1 at every stop. */
    heroInk: "#FFFFFF",
    /** Secondary text on `gradients.hero`, ≥ 4.78:1. */
    heroInkMuted: "#E9E4FF",
    /** `HeroButton` fill (inverse of the hero gradient). */
    heroAction: "#FFFFFF",
    /** `HeroButton` label, 6.12:1 on `heroAction`. */
    heroActionInk: "#5B3DF5",
    /** Focus ring outside a `HeroCard` (inside one, the ring is `heroInk`). */
    focusRing: "#5B3DF5",
    /** Stage scale, step 1 «Новое» — empty tile. */
    stageNew: "#FFFFFF",
    /** Stage scale, step 2 «Знакомлюсь». */
    stageMeeting: "#EEE9FF",
    /** Stage scale, step 3 «Узнаю». */
    stageRecognize: "#D6CCFF",
    /** Stage scale, step 4 «Вспоминаю». */
    stageRecall: "#A391FF",
    /** Stage scale, step 5 «Использую». */
    stageUse: "#6A4DF2",
    /** Stage scale, step 6 «Устойчиво». */
    stageStable: "#4A2BD6",
    /** Text on stage steps 1–4. Worst case 6.76:1 (`stageRecall`). */
    onStageLight: "#1A1433",
    /** Text on stage steps 5–6. Worst case 5.31:1 (`stageUse`). */
    onStageDeep: "#FFFFFF",
    /** Border on stage-step tiles 1–3, otherwise they merge into `background`. */
    stageEdge: "#C9C3E0",
    /** «Устойчиво» star mark, 5.1:1 on `stageStable`. */
    stageStableMark: "#FFC53D",
  },
  dark: {
    /** #65 V.7. `textInverse-dark` on it is 5.91:1. */
    primary: "#8F7BFF",
    /** #65 V.7: `primary-dark` (`#C4B8FF`) on this backdrop is 7.97:1. */
    primarySoft: "#2A2256",
    /**
     * Dark counterpart of `ringTrack` above. Dark `primarySoft` itself was
     * the spec's reference floor at 1.2465:1 — under the 1.25:1 requirement
     * once rounded honestly, not just visually tight. #3A3260 sits one step
     * lighter, in the same violet family as `border-dark` (#332D52), and
     * clears the floor at 1.54:1.
     */
    ringTrack: "#3A3260",
    accent: "#FFD764",
    /**
     * Was #3A3320 — gold mixed into near-black, which came out olive and
     * read as dirt against a violet dark theme. A deep violet carries the
     * gold as TEXT instead (9.8:1), which is how the badge renders in dark
     * mode; see the readiness pill on Home.
     */
    accentSoft: "#31294A",
    info: "#6BC0EC",
    /** #65 V.7. Fill/icons only — text uses `successInk-dark`. */
    success: "#34D399",
    warning: "#E8A54B",
    danger: "#E58585",
    /** Dark counterpart of `destructive` above — 7.03:1 as text on `surface`. */
    destructive: "#FF8A8A",
    /** Dark counterpart of `destructiveSoft` — `destructive` on it is 7.03:1. */
    destructiveSoft: "#3A1620",
    /** #65 V.7: deeper than before so `gradients.hero` and the stage scale glow. */
    background: "#0F0C1D",
    surface: "#1A1630",
    surfaceAlt: "#231E3D",
    border: "#2E2850",
    text: "#F4F1FF",
    /** #65 V.7: ≥ 6.71:1 on `surfaceAlt-dark`. */
    textMuted: "#ABA4C9",
    textInverse: "#0F0C1D",
    /**
     * Dark-theme scrim. `surface-dark` (#221E3B) sits close to
     * `background-dark` (#17142A), so separating the two without a shadow
     * needs more contrast than the light scrim — 80% alpha (`#CC`) instead
     * of 60%. Built from the darkest stop of `atmosphere.dark.sky`
     * (#100E20), which is already this theme's "deepest" colour, rather
     * than a fresh guess.
     */
    scrim: "#100E20CC",

    // --- #65 V.7: new tokens ---------------------------------------------
    /** Text on `successSoft-dark`, 9.57:1. */
    successInk: "#6EE7B7",
    successSoft: "#0F2E26",
    /** 9.95:1 to `surface-dark`. */
    attention: "#FFB547",
    /** Text on `attentionSoft-dark`, 9.04:1. */
    attentionInk: "#FFC46B",
    attentionSoft: "#3A2710",
    /** 6.53:1 to `surface-dark`. */
    pair: "#FF6B9E",
    /** Text on `pairSoft-dark`, 7.42:1. */
    pairInk: "#FF8FB8",
    pairSoft: "#3A1530",
    heroInk: "#FFFFFF",
    heroInkMuted: "#EDE9FF",
    heroAction: "#F4F1FF",
    /** 7.02:1 on `heroAction-dark`. */
    heroActionInk: "#4A2DDB",
    focusRing: "#C4B8FF",
    /** Stage scale in dark theme is inverted: step 1 is the darkest tile. */
    stageNew: "#1A1630",
    stageMeeting: "#2A2350",
    stageRecognize: "#3D3278",
    stageRecall: "#5A48B8",
    stageUse: "#8C7AF5",
    /** Lightest step — the folder «наливается светом» toward «Устойчиво». */
    stageStable: "#C4B8FF",
    /** Worst case 6.18:1 (`stageRecall-dark`). */
    onStageLight: "#F4F1FF",
    /** Worst case 5.70:1 (`stageUse-dark`). */
    onStageDeep: "#0F0C1D",
    stageEdge: "#4A4270",
    /** 10.68:1 on `stageStable-dark`. */
    stageStableMark: "#0F0C1D",
  },
} as const;

/**
 * Primary-action gradient. Both stops must clear WCAG AA against the label
 * colour that sits on top of the whole sweep.
 *
 * #65 V.7 replaces both stops: light-theme white label is 6.12:1 / 6.32:1,
 * dark-theme `text-inverse-dark` label is 6.94:1 / 8.45:1. The prior stops
 * (#5E4BBA/#7566CE, #8273D9/#9384E4) are gone — this is a value change, not
 * an addition, so `Button variant="primary"` recolours automatically.
 */
export const gradients = {
  primary: ["#5B3DF5", "#7B2FE0"] as const,
  primaryDark: ["#9D8BFF", "#B79CFF"] as const,
  /**
   * Full-bleed backdrop for the entry screen — a barely-there vertical wash
   * that lifts the top of the page. Both stops sit within a shade of
   * `background`, so it reads as depth rather than as a coloured panel.
   */
  welcome: ["#F5F3FE", "#EAE6F9"] as const,
  welcomeDark: ["#1B1733", "#141126"] as const,
  /**
   * #65 V.7: `HeroCard`'s backdrop (today-session.design.md §3.3), 135°.
   * `heroInk` (white) clears ≥ 5.9:1 against every stop in both themes.
   */
  hero: ["#5B3DF5", "#8E2FD9", "#AD2F86"] as const,
  heroDark: ["#4F2FD0", "#7A2AB8", "#9A2F7A"] as const,
  /**
   * #65 V.7: radial sheen decal on `HeroCard`, from the top-right corner.
   * 8-digit hex alpha — see `atmosphere` above for why `rgba()` is avoided.
   */
  heroSheen: ["#FFFFFF33", "#FFFFFF00"] as const,
  heroSheenDark: ["#FFFFFF1F", "#FFFFFF00"] as const,
};

/**
 * The entry screen's atmosphere — near-white at the top, a cold lavender
 * glow through the middle, soft cloud shapes at the foot so the mascot reads
 * as standing on them.
 *
 * Built from gradients alone, with no `filter: blur()`. A radial gradient
 * whose last stop is fully transparent already has no visible edge, and
 * blurring a full-bleed view costs an offscreen pass every frame on a phone
 * for a result that costs nothing here.
 *
 * All alpha values are `#rrggbbaa`: React Native accepts eight-digit hex on
 * every target, while `rgba()` inside a gradient string is parsed by three
 * different engines and does not survive all of them.
 */
export const atmosphere = {
  light: {
    /** Top-to-bottom wash. Starts at pure white — the reference's top third. */
    sky: ["#FFFFFF", "#FCFBFF", "#F7F4FE", "#F0EBFC"] as const,
    /** Wide lavender bloom sitting low and centre. */
    glowMain: ["#9A82E838", "#B0A0EE20", "#C9BEF50E", "#FFFFFF00"] as const,
    /** Warmer violet, bottom-left. */
    glowSide: ["#7860D633", "#9683E01C", "#FFFFFF00"] as const,
    /** The mascot's tail blue, bottom-right, kept fainter than the violets. */
    glowCool: ["#6BC0EC2B", "#A5D6F214", "#FFFFFF00"] as const,
    /** Cloud body: bright crown, lavender underside. */
    cloud: ["#FFFFFFFA", "#FAF8FFEB", "#E2D9FCB8"] as const,
  },
  dark: {
    sky: ["#1B1733", "#191530", "#15122A", "#100E20"] as const,
    glowMain: ["#7E6FD83D", "#6455B024", "#4A3F8410", "#00000000"] as const,
    glowSide: ["#9384E42E", "#6C5FB818", "#00000000"] as const,
    glowCool: ["#4E93B82B", "#3A6E8C14", "#00000000"] as const,
    cloud: ["#2E2750F5", "#272144E8", "#1F1A38C4"] as const,
  },
};

/**
 * Shadow colour for raised surfaces. A tinted near-black rather than pure
 * black: on a lavender background a neutral shadow reads as grey dirt, while
 * a violet-tinted one sits in the same family as the page.
 */
export const shadowColor = "#3C2D78";

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/**
 * One-off pixel sizes that don't belong on the `spacing` scale (which is a
 * gap/padding rhythm, not a component-dimension list). Introduced for
 * `ProgressRing` and `Sheet` (home.design.md §Composition, new primitives).
 */
export const sizing = {
  /**
   * `ProgressRing`'s outer diameter inside `ModuleCircle`. At a 320pt-wide
   * screen with `spacing.lg` side padding, three 80px circles leave 16px
   * between each pair — above the `spacing.sm` (8px) floor the spec sets.
   */
  moduleCircle: 80,
  /** Minimum grid-cell width `ModuleCircle`'s column count is computed from. */
  moduleCell: 112,
  /** `ProgressRing`'s default stroke width. */
  progressRingStroke: 4,
  /** Gap between `ProgressRing`'s inner edge and the disc it wraps. */
  progressRingGap: 4,
  /** `Sheet`'s panel width on `breakpoints.wide` and up. */
  sheetMaxWidth: 480,
  /**
   * Side of the tick box (`features/dictionary/CheckMark`). The tap target is
   * the whole row it sits in, never the box itself, so it can stay below 44.
   */
  checkbox: 22,
  /** Settings (#40): diameter of `Monogram`, the profile-card avatar circle. */
  avatar: 64,
  /** Settings (#40): max width of the single settings column, both breakpoints. */
  settingsColumn: 640,

  // --- #65 V.7 (today-session.design.md) --------------------------------
  /** Minimum tap target, TZ §11. Replaces the `min-h-[44px]` literal — use `min-h-tap` / `h-tap` / `w-tap`. */
  tapTarget: 44,
  /** `ProgressRing` inside the "Сегодня" hero, `in_progress` state. */
  todayRing: 64,
  /** Pause/day-summary column width on the wide breakpoint. */
  readingColumn: 560,
  /** Left ("Сегодня") column width on the wide "Словарь" layout. */
  heroColumn: 400,
  /** Focus-ring stroke width; the ring sits `2` outside the element it wraps. */
  focusRingWidth: 3,

  // --- exercise.design.md §9 ---------------------------------------------
  /** `ExerciseShell` content column on the wide breakpoint. */
  exerciseColumn: 640,
  /** `OptionTile` minimum height. */
  optionMinHeight: 64,
  /** Square side of a W1/W2 hanzi-choice tile. */
  hanziChoice: 88,
  /** `StudyProgress` thickness. */
  progressHeight: 10,

  // --- folder-study.design.md §8 ------------------------------------------
  /** `StudyButton`'s two-line height. */
  studyButton: 72,

  // --- folder-map.design.md §8 --------------------------------------------
  /** `WordTile` minimum width/height on the word-grid. */
  wordTile: 106,
  /** Dashed "due" border thickness on a `WordTile`. */
  dueBorder: 2,
  /** `StageBar`, default size, in a folder's header. */
  stageBar: 12,
  /** `StageBar`, `mini` size, on a `FolderCard`. */
  stageBarMini: 6,
  /** `SkillMeter` pip height. */
  skillPip: 6,
  /** Minimum `FolderCard` width in the folder grid. */
  folderCardMin: 280,
} as const;

/**
 * #65 V.7 (exercise.design.md §9): opacity for a dimmed/inert element — an
 * `OptionTile` that is neither the chosen nor the correct answer, once one
 * has been submitted. `text` (not `textMuted`) is the label colour paired
 * with it, since `textMuted` at this opacity would drop under 4.5:1.
 */
export const opacity = {
  dimmed: 0.6,
} as const;

/**
 * Settings (#40, settings.design.md «Новые токены»): the one motion-duration
 * value this task's own spec introduces (not part of #65's `motion.*`, which
 * is out of scope here — see settings.design.md §V-F). Consumed only from
 * JS (`setTimeout`), never a `className`, the same way `sizing.checkbox`
 * above has no Tailwind counterpart — there is no Tailwind utility that
 * reads a bare millisecond count outside of `transition-duration`, which
 * `SaveStatus` does not use (its held/faded states are visibility swaps, not
 * CSS transitions).
 */
export const motion = {
  /** How long `SaveStatus`'s "Сохранено" stays on screen before fading. */
  statusHold: 1600,

  // --- #65 V.7 (today-session.design.md §V.6) -----------------------------
  /** Press, selection change. */
  fast: 120,
  /** Tray slide, task change, bar fill. */
  base: 220,
  /** Stage-up celebration, summary appearance. */
  slow: 420,
  /** Every entrance. A cubic-bezier string — `Animated.timing`'s `easing` on
   *  native takes a function, so this is read only by the web/CSS path
   *  (`shared/platform/`); native call sites use `Easing.out(Easing.quad)`,
   *  the closest RN built-in to the same curve. */
  easeOut: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  /** The "pружина" on a correct option / a revealed card — a Reanimated
   *  `withSpring` config, not a duration. */
  spring: { damping: 16, stiffness: 240, mass: 1 },
  /** Scale-down on press. */
  pressScale: 0.97,
} as const;

/**
 * Layout breakpoints, read via `useWindowDimensions` (not a `className`
 * media-query variant) wherever a screen needs to branch its own layout
 * logic rather than just its styling — see `(tabs)/_layout.tsx`'s sidebar
 * switch, which this token now backs instead of a second `768` literal.
 */
export const breakpoints = {
  wide: 768,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  /** Cards. Larger than `lg` and softer than `xl` — the reference sits here. */
  card: 22,
  xl: 24,
  pill: 999,
  /** #65 V.7: `OptionTile`, `WordTile`, other answer/word tiles. */
  tile: 18,
  /** #65 V.7: `HeroCard`, `AnswerTray`. */
  hero: 32,
} as const;

/**
 * #65 V.7: raised-surface depth. `raised` is the everyday card/tile shadow;
 * `glow` is the coloured shadow under `HeroCard` and `AnswerTray` — in the
 * dark theme it reads as a glow rather than a shadow, per V.5/V.6.
 *
 * Shaped as RN shadow props (`shadowColor`/`shadowOffset`/`shadowOpacity`/
 * `shadowRadius`) rather than a CSS string: this is the one place a raw
 * value is needed outside a `className` (a `style` prop on native), same
 * reasoning as `shadowColor` above. The `className` mirror lives in
 * `tailwind.config.js`'s `boxShadow` (`shadow-raised` / `shadow-glow`).
 */
export const elevation = {
  raised: {
    shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  glow: {
    light: {
      shadowColor: "#5B3DF5",
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.28,
      shadowRadius: 40,
    },
    dark: {
      shadowColor: "#8F7BFF",
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.22,
      shadowRadius: 48,
    },
  },
} as const;

/**
 * Font families, keyed by the weight each file actually carries.
 *
 * React Native does not synthesise weights from one file the way a browser
 * does: asking for `fontWeight: 800` on a Regular face gives you Regular on
 * Android and a faked smear on iOS. So each weight in the scale below maps
 * to its own loaded family, and `Text` picks the family rather than setting
 * a numeric weight.
 *
 * #65 V.2/V.7 (DS13): Plus Jakarta Sans is replaced by Inter — `fc-query`
 * against `assets/fonts/PlusJakartaSans-*.ttf` found no Cyrillic block
 * (`0400–04FF`) and no third-tone pinyin letters (`U+01CD–U+01DC`), so the
 * whole Russian UI and half the pinyin alphabet were rendering in the
 * browser's fallback face, not Plus Jakarta, and `mǎi` mixed two fonts in
 * one word. Inter carries both. The keys are unchanged (`regular` …
 * `extrabold`) — every existing `font-*` className recolours^Wreflows to
 * Inter automatically, no call-site edits needed.
 *
 * `hanziRegular` / `hanziMedium` / `hanziBold` back `HanziText` — Noto Sans
 * SC (OFL), the only family in `fontFamily` that isn't `fontFamily.ui`.
 * Family strings match the export names `@expo-google-fonts/*` registers
 * with `useFonts` (`app/_layout.tsx`), which is what an RN `fontFamily`
 * style must equal.
 */
export const fontFamily = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  extrabold: "Inter_800ExtraBold",
  hanziRegular: "NotoSansSC_400Regular",
  hanziMedium: "NotoSansSC_500Medium",
  hanziBold: "NotoSansSC_700Bold",
} as const;

/**
 * Type scale, tuned along Material 3's two rules for a display-to-body ramp.
 *
 * 1. TRACKING FOLLOWS SIZE, INVERSELY. Large text at default spacing reads
 *    loose and soft, so display and title carry negative letter-spacing;
 *    small text needs the opposite, which is why `caption` sits at zero and
 *    the uppercase labels add their own positive tracking at the call site.
 * 2. WEIGHT CARRIES THE HIERARCHY, not size alone. Display and title move to
 *    800 and heading to 700, so a heading still reads as a heading when it
 *    wraps to two lines and the size cue weakens.
 *
 * Line heights tighten with size for the same reason — 40/34 on display is
 * about 1.18, against 1.5 on body, which is where comfortable reading sits.
 */
export const typography = {
  display: { size: 34, weight: "800", lineHeight: 40, letterSpacing: -1.0 },
  title: { size: 24, weight: "800", lineHeight: 30, letterSpacing: -0.6 },
  heading: { size: 18, weight: "700", lineHeight: 24, letterSpacing: -0.3 },
  body: { size: 16, weight: "400", lineHeight: 24, letterSpacing: 0 },
  /** Doubles as Material's "label" role, hence medium rather than regular. */
  caption: { size: 13, weight: "500", lineHeight: 18, letterSpacing: 0 },
  /**
   * Tab-bar labels only, and smaller than `caption` on purpose: under a 22px
   * glyph the word is a name for the icon rather than something to read, and
   * at 13px the pair looks like two competing elements. Both iOS and Material
   * put tab labels at 10–12px for the same reason.
   *
   * Not a general "smallest text" size — nothing else may reach for it, since
   * 11px body copy would fail readability everywhere else in the app.
   */
  tabLabel: { size: 11, weight: "600", lineHeight: 14, letterSpacing: 0.1 },

  // --- #65 V.7/V.3: new sizes, набраны `fontFamily.ui` --------------------
  /** The task count in the "Сегодня" hero (`CountUp`). Tabular figures. */
  numberHero: { size: 56, weight: "800", lineHeight: 60, letterSpacing: -1.5, tabularNums: true },
  /** Uppercase section label ("СЕГОДНЯ", "НОВОЕ СЛОВО"). */
  eyebrow: { size: 12, weight: "700", lineHeight: 16, letterSpacing: 1.2 },
  /** Pinyin reading under `typography.hanziHero`. */
  pinyinHero: { size: 24, weight: "500", lineHeight: 30, letterSpacing: 0 },

  // --- #65 V.7/V.3: hanzi type scale, набрана `fontFamily.hanzi` ----------
  // Read only by `HanziText` (DS5) — plain `Text` has no `variant` for these.
  /** Exercise/intro hero character, 1–2 знака. */
  hanziHero: { size: 96, weight: "500", lineHeight: 116, letterSpacing: 0 },
  /** Same role, 3+ знака — `HanziText variant="hero"` switches to this by length. */
  hanziHeroLong: { size: 64, weight: "500", lineHeight: 80, letterSpacing: 0 },
  /** Answer options (W1/W2, C1), C2 tiles. */
  hanziOption: { size: 40, weight: "500", lineHeight: 52, letterSpacing: 0 },
  /** Chinese sentences — examples, collocations, C1/C2. Line height ×1.57 per TZ §15. */
  hanziSentence: { size: 28, weight: "400", lineHeight: 44, letterSpacing: 0 },
  /** Folder-map word tile. */
  hanziTile: { size: 30, weight: "500", lineHeight: 38, letterSpacing: 0 },
  /** A character inline inside a Russian sentence. */
  hanziInline: { size: 20, weight: "500", lineHeight: 28, letterSpacing: 0 },
} as const;

export type ColorScheme = keyof typeof colors;
export type ColorToken = keyof typeof colors.light;
