const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

/**
 * SVG as components.
 *
 * The icons ship as `.svg` and have to recolour when a tab is selected, so
 * they cannot be images: `Image` only tints a raster, and the source files
 * are vectors. `react-native-svg-transformer` compiles each file into a
 * React component whose `fill` is a prop — one file per icon, sharp at any
 * size, and the same on iOS, Android and web.
 *
 * The two lines below are the standard pairing: `.svg` must leave
 * `assetExts` (or Metro keeps treating it as a static asset and the
 * transformer never runs) and enter `sourceExts`.
 */
config.transformer.babelTransformerPath = require.resolve("react-native-svg-transformer");
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== "svg");
config.resolver.sourceExts = [...config.resolver.sourceExts, "svg"];

module.exports = withNativeWind(config, { input: "./shared/config/global.css" });
