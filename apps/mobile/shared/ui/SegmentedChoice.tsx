import { useRef, useState } from "react";
import { Pressable, View, type View as RNView } from "react-native";
import { useTheme } from "@/shared/lib/useTheme";
import { nextSegmentedIndex } from "@/shared/lib/segmentedChoiceNav";
import { focusRef } from "@/shared/platform/focusRef";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

export interface SegmentedChoiceOption<Value extends string> {
  value: Value;
  /** Visible label, up to 2 lines. */
  label: string;
  /** Left of the label, `aria-hidden` — S7 ("Системная" gets `monitor`, etc.). */
  icon?: IconName;
  /**
   * Spoken name for this option, when it needs to differ from `label` — e.g.
   * `settings.review.minutesA11y` ("10 минут") vs. the visible "10 мин".
   */
  accessibilityLabel?: string;
}

export type SegmentedChoiceSize = "large" | "compact";

export interface SegmentedChoiceProps<Value extends string> {
  options: readonly SegmentedChoiceOption<Value>[];
  /** `null` when the stored value matches none of `options` (settings.design.md §3.4: nothing selected, Tab lands on the first option). */
  value: Value | null;
  onChange: (value: Value) => void;
  /** Names the group — `radiogroup`'s `accessibilityLabel`. */
  accessibilityLabel: string;
  /** `nativeID` of the hint this group is described by (`SettingBlock`'s `hintId`) — wired to `aria-describedby`. */
  describedById?: string;
  size?: SegmentedChoiceSize;
  className?: string;
}

/**
 * DS4 (today-session.design.md §9) + S7 (settings.design.md §9): a
 * `radiogroup` of 2–4 mutually exclusive options, one roving Tab stop,
 * arrow keys both move focus AND select (WAI-ARIA radiogroup pattern —
 * the same as a native `<input type="radio">` group), Home/End jump to the
 * ends.
 *
 * `react-native-web` 0.21 forwards `aria-*` straight to the DOM but not
 * `accessibilityState.checked` (confirmed for the same gap in
 * `features/dictionary/CheckMark.tsx`), so `aria-checked` is set directly
 * here rather than through `accessibilityState` alone.
 *
 * `motion.spring` (#65, the selected segment's "pружина") is not in
 * `tokens.ts` yet — settings.design.md §V-F replaces every #65 motion token
 * with an instant, unanimated state change until it lands, so the selected
 * segment's fill/label colour just switches immediately.
 */
export function SegmentedChoice<Value extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  describedById,
  size = "compact",
  className = "",
}: SegmentedChoiceProps<Value>) {
  const { colors } = useTheme();
  const refs = useRef<(RNView | null)[]>([]);

  const selectedIndex = options.findIndex((option) => option.value === value);
  // Roving tabindex: the selected option is the group's one Tab stop; with
  // nothing selected, Tab lands on the first option instead.
  const [rovingIndex, setRovingIndex] = useState(Math.max(selectedIndex, 0));
  const activeIndex = selectedIndex >= 0 ? selectedIndex : rovingIndex;

  const move = (from: number, key: string) => {
    const next = nextSegmentedIndex(from, options.length, key);
    if (next === null) return false;
    setRovingIndex(next);
    onChange(options[next]!.value);
    focusRef({ current: refs.current[next] ?? null });
    return true;
  };

  const heightClass = size === "large" ? "min-h-[56px]" : "min-h-[44px]";
  // #65-token: sizing.tapTarget — §V-F's one allowed literal until the
  // token lands (both sizes clear the 44px floor; `large` is taller still).

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      className={`flex-row overflow-hidden rounded-pill bg-surface-alt dark:bg-surface-alt-dark ${className}`}
      // RN's `AccessibilityProps` has no `aria-describedby` (checked
      // node_modules/react-native/Libraries/Components/View/ViewAccessibility.d.ts);
      // same escape hatch as `SettingsGroup`'s `aria-level`.
      {...(describedById ? ({ "aria-describedby": describedById } as object) : {})}
    >
      {options.map((option, index) => {
        const checked = index === selectedIndex;
        const roving = index === (selectedIndex >= 0 ? selectedIndex : rovingIndex);

        return (
          <Pressable
            key={option.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            accessibilityRole="radio"
            aria-checked={checked}
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            tabIndex={roving ? 0 : -1}
            onPress={() => {
              setRovingIndex(index);
              onChange(option.value);
            }}
            onFocus={() => setRovingIndex(index)}
            // `onKeyDown` exists on web's `View`/`Pressable` DOM node but not
            // in React Native's own types — same cast `CheckRow` uses.
            {...({
              onKeyDown: (event: { key: string; preventDefault(): void }) => {
                if (move(activeIndex, event.key)) event.preventDefault();
              },
            } as object)}
            className={`flex-1 flex-row items-center justify-center gap-xs px-sm py-xs ${heightClass} ${
              checked ? "bg-primary dark:bg-primary-dark" : ""
            }`}
          >
            {option.icon ? (
              // No `label` passed: `Icon` defaults to `aria-hidden` when
              // undecorated (see `Icon.tsx`), which is what S7 wants here —
              // the visible label text already names the option.
              <Icon name={option.icon} size={16} color={checked ? colors.textInverse : colors.text} />
            ) : null}
            <Text
              variant="caption"
              numberOfLines={2}
              className={`text-center font-medium ${
                checked ? "text-text-inverse dark:text-text-inverse-dark" : "text-text dark:text-text-dark"
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
