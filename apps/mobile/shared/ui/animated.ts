import { Pressable } from "react-native";
import Animated from "react-native-reanimated";
import { cssInterop } from "nativewind";

/**
 * NativeWind переводит `className` в `style` только у зарегистрированных
 * компонентов. Reanimated-обёртки в этот список не входят — без
 * `cssInterop` они молча теряют все классы: фон, скругление, отступы,
 * `absolute` (так после #65 у всех кнопок пропала заливка, а ползунок
 * `SegmentedChoice` встал в поток). Модуль импортируется первым в
 * `shared/ui/index.ts`, до любого `Animated.View` с классами.
 */
cssInterop(Animated.View, { className: "style" });

/** `Pressable`, которому Reanimated может анимировать `style` (`motion.pressScale`). */
export const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
cssInterop(AnimatedPressable, { className: "style" });
