/**
 * `*.svg` imports resolve to React components, not to asset paths — see the
 * transformer wiring in `metro.config.js`. Without this declaration
 * TypeScript still believes an `.svg` import is a module it has never heard
 * of, and every icon import is a compile error.
 *
 * `SvgProps` carries `fill`, `width`, `height` and the accessibility props,
 * which is what the tab bar sets per selected state.
 */
declare module "*.svg" {
  import type { FC } from "react";
  import type { SvgProps } from "react-native-svg";

  const content: FC<SvgProps>;
  export default content;
}
