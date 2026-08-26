import { useColorScheme } from "react-native";
import { colors, type ColorScheme } from "@/shared/config/tokens";

export function useTheme() {
  const system = useColorScheme();
  const scheme: ColorScheme = system === "dark" ? "dark" : "light";
  return { scheme, colors: colors[scheme] };
}
