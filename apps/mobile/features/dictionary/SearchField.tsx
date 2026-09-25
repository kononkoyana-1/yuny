import { useState, type Ref } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Icon, IconButton } from "@/shared/ui";
import { useTheme } from "@/shared/lib/useTheme";
import { t } from "@/shared/i18n";

interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  ref?: Ref<TextInput>;
}

/**
 * Поиск в самом верху главного экрана: поле-«таблетка» с лупой слева и
 * крестиком очистки внутри поля — крестик не сдвигает поле, когда
 * появляется. Нажатие в любом месте поля ставит курсор; фокус — рамкой
 * `primary`, как у `Input` (системная обводка браузера скрыта).
 */
export function SearchField({ value, onChangeText, onClear, ref }: SearchFieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [input, setInput] = useState<TextInput | null>(null);

  return (
    <Pressable
      accessible={false}
      onPress={() => input?.focus()}
      className={`h-search flex-row items-center gap-sm rounded-pill border bg-surface pl-md pr-xs shadow-raised dark:bg-surface-dark ${
        focused ? "border-primary dark:border-primary-dark" : "border-border dark:border-border-dark"
      }`}
    >
      <Icon name="search" size={18} color={focused ? colors.primary : colors.textMuted} />
      <TextInput
        ref={(node) => {
          setInput(node);
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as { current: TextInput | null }).current = node;
        }}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={t("dictionary.search.placeholder")}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={t("dictionary.search.a11y")}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        inputMode="search"
        maxLength={64}
        className="h-full flex-1 text-body text-text dark:text-text-dark"
        style={{ outlineWidth: 0 }}
      />
      {value !== "" ? (
        <IconButton icon="close" accessibilityLabel={t("dictionary.search.clear")} onPress={onClear} />
      ) : (
        <View className="w-xs" />
      )}
    </Pressable>
  );
}
