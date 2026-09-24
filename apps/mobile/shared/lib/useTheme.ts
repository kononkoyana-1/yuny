import { useColorScheme } from "nativewind";
import { colors, type ColorScheme } from "@/shared/config/tokens";

/**
 * Итоговая тема для значений, которые нельзя задать классом (`style`,
 * цвета навигации). Берётся из NativeWind — того же источника, что включает
 * классы `dark:`, — поэтому выбор темы в настройках (#40) действует и здесь.
 */
export function useTheme() {
  const { colorScheme: scheme } = useColorScheme();
  const current: ColorScheme = scheme === "dark" ? "dark" : "light";
  return { scheme: current, colors: colors[current] };
}
