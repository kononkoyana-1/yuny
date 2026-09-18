/**
 * Minimal Jest setup for pure-logic unit tests (design spec `upload.design.md`
 * §Open Question 1 / review round 2, decision 1). Only `features/upload/{errorRoute,selection}.ts`
 * have tests today — both are plain `(input) => output` functions with no
 * rendering, so this intentionally does not pull in React Native Testing
 * Library or Maestro.
 *
 * Preset is `jest-expo`, not a hand-rolled `ts-jest`/`babel-jest` config:
 * `selection.ts` imports `Image` from `react-native` and `ImageManipulator`
 * from `expo-image-manipulator` at module scope (only their *other* exports
 * are under test), and both ship Flow/ESM sources under `node_modules` that
 * need Metro's own Babel transform + `transformIgnorePatterns` to load at
 * all — `ts-jest` cannot parse Flow, and a hand-written `babel-jest` config
 * would just end up reproducing what `jest-expo` already ships (asset stubs,
 * `@react-native/jest-preset` transform, native-module mocks). It costs a
 * jsdom environment we don't otherwise need, but that's a smaller price than
 * maintaining a parallel transform pipeline by hand.
 */
module.exports = {
  preset: "jest-expo",
  testMatch: ["<rootDir>/features/**/*.test.ts"],
};
