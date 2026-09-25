import type { ReactNode, Ref } from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/shared/ui";
import { sizing } from "@/shared/config/tokens";

/**
 * Квадрат галочки — только картинка. Роль, подпись и состояние несёт строка
 * `CheckRow`, в которой он стоит.
 */
export function CheckMark({ checked }: { checked: boolean }) {
  return (
    <View
      style={{ width: sizing.checkbox, height: sizing.checkbox }}
      className={`items-center justify-center rounded-sm border-2 ${
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

export interface CheckRowProps {
  checked: boolean;
  onToggle: () => void;
  accessibilityLabel: string;
  busy?: boolean;
  className?: string;
  ref?: Ref<View>;
  children: ReactNode;
}

/**
 * Строка-галочка: выбор папок у статьи и список слов из файла. Вся строка —
 * тап-таргет, роль `checkbox`.
 *
 * Два места, где react-native-web ведёт себя не как чекбокс, и оба закрыты
 * здесь, а не в каждом вызове:
 *   * `accessibilityState.checked` не доходит до DOM — `aria-checked` ставим
 *     сами, иначе скринридер не слышит состояния;
 *   * пробел нажимает только `role="button"` (`PressResponder.isValidKeyPress`),
 *     а для чекбокса пробел — основная клавиша. Ловим его сами и гасим
 *     прокрутку страницы, которую он иначе вызвал бы
 *     (dictionary.review.md n4, upload-words.review.md m2).
 */
export function CheckRow({
  checked,
  onToggle,
  accessibilityLabel,
  busy = false,
  className = "",
  ref,
  children,
}: CheckRowProps) {
  const webKeys = {
    onKeyDown: (event: { key: string; repeat?: boolean; preventDefault(): void }) => {
      if (event.key !== " " && event.key !== "Spacebar") return;
      event.preventDefault();
      if (!event.repeat) onToggle();
    },
  };

  return (
    <Pressable
      ref={ref}
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked, busy }}
      aria-checked={checked}
      aria-busy={busy}
      onPress={onToggle}
      className={`min-h-tap ${busy ? "opacity-50" : ""} ${className}`}
      // `onKeyDown` есть у View в react-native-web, но не в типах React Native.
      {...(webKeys as object)}
    >
      {children}
    </Pressable>
  );
}
