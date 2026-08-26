# Episodic Memory — frontend-builder

One entry per completed task: what was done, what was learned, in the form
"did X, hit Y, resolved by Z". Populated only via the Reflect step
(AGENT_FRAMEWORK.md §6) after a real task — not pre-filled.

## Phase 0 — monorepo scaffold (2026-08-26)

Scaffolded the pnpm+Turborepo monorepo and `apps/mobile` (Expo 57 + expo-router
+ NativeWind v4). Three separate "grabbed npm `latest`, it broke" incidents in
one session:

- `typescript@latest` resolved to 7.0.2 (the new Go-based compiler line).
  Expo's own `create-expo-app` template pins `~6.0.3` — trusted that pin
  instead. Lesson: for any package Expo's official template also pins,
  trust the template's version over the npm `latest` tag.
- `tailwindcss@latest` resolved to 4.3.3, but NativeWind v4's peer range
  (`>3.3.0`) is satisfied by 4.x on paper while actually being built for
  Tailwind v3's JS config format. Found `npm dist-tag v3-lts` → `3.4.19` and
  used that. Lesson: a satisfied semver peer range does not mean actual
  compatibility — check what the peer's *config format* assumes, not just
  the version range.
- `eslint@latest` resolved to 10.9.1; `eslint-config-expo`'s transitive
  `eslint-plugin-import`/`eslint-plugin-react` peer ranges cap at ESLint 9.
  Caught via `pnpm peers check` after install, not before — should check
  peer ranges of a config package's own dependents before installing the
  linter version, not after.

Also hit two issues `expo-doctor` caught that manual `tsc`/`eslint` did not:
`newArchEnabled` in `app.json` is no longer a valid schema field on SDK 57
(New Architecture is now unconditional), and `react-native-reanimated@4.x`
requires `react-native-worklets` as a separate peer dependency plus its own
babel plugin (`react-native-worklets/plugin`) — neither was flagged until
`expo-doctor` ran. Lesson: run `expo-doctor` after any dependency change,
not just `tsc`/`eslint` — it catches a different class of error (schema and
native peer-dependency issues) that type-checking cannot see.

Under pnpm's strict (non-hoisting) `node_modules`, Metro failed to resolve
`react-native-css-interop/jsx-runtime` even though it bundles fine at
runtime for Node — NativeWind's `babel-preset-expo` jsxImportSource setting
requires that package reachable from the *app's own* node_modules, and pnpm
only symlinks a package's own declared dependencies into its own nested
node_modules, not into a sibling that merely imports from it. Fix: add
`react-native-css-interop` as an explicit direct dependency of `apps/mobile`
even though nothing in the app imports it directly — it is nativewind's
transitive dependency being consumed by Metro at a different level than
Node's module resolution accounts for. Lesson: any package a Metro-processed
babel transform imports by string path (not by JS `import`) needs to be a
direct dependency under pnpm, regardless of whether it's "really" a
transitive dependency conceptually.

## Phase 2 — nav shell, `expo-router/ui` Tabs empty-screens crash (2026-08-26)

The four-tab layout (`app/(tabs)/_layout.tsx`) built during Phase 1+2 wrapped
`TabSlot`/`TabList` in a plain `<View>` for the responsive bottom-bar/sidebar
layout. This passed `tsc`, `eslint`, and `expo export --platform web`
completely clean, but crashed at runtime in the browser with "Couldn't find
any screens for the navigator" — caught by the root `ErrorBoundary`.

Root cause (confirmed by reading `expo-router/build/ui/Tabs.js` directly, not
guessed): `Tabs`'s internal `parseTriggersFromChildren` walk only recurses
into `Fragment` and `TabList` nodes when scanning its `children` for
triggers — never into a plain `View`. Wrapping `TabSlot`/`TabList` in a `View`
makes them unreachable from that walk, so the trigger list — and therefore
the registered screen list — silently ends up empty.

Fix: `TabSlot` and `TabList` must be **direct children of `Tabs`**. Both
`Tabs` and `TabList` forward `className`/`style` onto their own rendered
`View`, so layout classes (including responsive `md:` variants) go directly
on them — no wrapper `View` needed at all. Full pattern saved in
`~/.claude/projects/.../memory/expo_router_tabs_no_wrapper_view.md`.

Lesson: **this class of bug is invisible to every automated check available
in this sandbox** (typecheck, lint, static web export) — it only manifests
during client-side React Navigation hydration. When building on
`expo-router/ui`'s headless Tabs (or similarly "structural JSX matters"
libraries), read the library's own children-parsing source before adding any
wrapping element around its required children, and treat "the user loading
the page and reporting what they see" as a necessary verification step, not
an optional nice-to-have — static checks passing is not evidence this class
of bug is absent.

Also: don't over-invest in *proving* a diagnosis once the library source
gives an unambiguous answer — spent real time trying to install a headless
browser (Playwright/Chromium) to visually confirm a runtime error that
reading the actual `Tabs.js` source already explained conclusively. In a
sandbox without `sudo` (browser installs need system deps), that installation
attempt was pure sunk cost. When source-reading gives a mechanistic,
traceable explanation, apply the fix and ask the user to verify — don't
chase a redundant automated confirmation the environment can't cheaply give.
