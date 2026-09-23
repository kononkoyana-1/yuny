import { View } from "react-native";
import { Text } from "@/shared/ui";

/**
 * Квадрат галочки — только картинка. Роль `checkbox`, подпись и
 * `aria-checked` несёт строка, в которой он стоит: в выборе папок у статьи и
 * в списке слов из файла.
 */
export function CheckMark({ checked }: { checked: boolean }) {
  return (
    <View
      className={`h-[22px] w-[22px] items-center justify-center rounded-sm border-2 ${
        checked
          ? "border-primary bg-primary dark:border-primary-dark dark:bg-primary-dark"
          : "border-border dark:border-border-dark"
      }`}
      aria-hidden
    >
      {checked ? (
        <Text variant="caption" tone="inverse" className="font-bold">
          ✓
        </Text>
      ) : null}
    </View>
  );
}
