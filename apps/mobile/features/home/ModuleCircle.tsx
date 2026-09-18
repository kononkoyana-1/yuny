import { forwardRef, useState } from "react";
import { Pressable, View } from "react-native";
import type { ModuleProgress } from "@yuny/shared";
import { ProgressRing, Text } from "@/shared/ui";
import { sizing } from "@/shared/config/tokens";
import { t } from "@/shared/i18n";
import { coverText } from "./coverText";

export interface ModuleCircleProps {
  module: ModuleProgress;
  onPress: (moduleId: string) => void;
}

/**
 * One module on Главная (home.design.md §3). Not a `shared/ui` primitive —
 * it is built from `ProgressRing` + `Text` + tokens for this one screen
 * only (§Composition, "ModuleCircle — не примитив").
 *
 * `forwardRef` so the screen can keep one `RefObject<View>` per module and
 * pass the pressed circle's ref to `Sheet` as `returnFocusRef` — the sheet
 * must return assistive-tech focus to the exact circle that opened it.
 */
export const ModuleCircle = forwardRef<View, ModuleCircleProps>(function ModuleCircle(
  { module, onPress },
  ref,
) {
  const [pressed, setPressed] = useState(false);

  // Server-picked text (server P1, home.design.md §1) or, when the module
  // has no short word, the module's own first grapheme — never a client
  // guess at what the material was about.
  const disc = module.cover_text ?? coverText(module.title);

  // Inner edge of the ring's track sits at `size - 2 * strokeWidth`; the
  // disc backs off `progressRingGap` further from there on every side
  // (§3, "диск с отступом sizing.progressRingGap от внутреннего края кольца").
  const discSize = sizing.moduleCircle - 2 * sizing.progressRingStroke - 2 * sizing.progressRingGap;

  const label = t("home.module.a11y", {
    title: module.title,
    done: module.done_tasks,
    count: module.total_tasks,
  });

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={t("home.module.a11yHint")}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={() => onPress(module.module_id)}
      className="items-center gap-sm self-stretch"
    >
      {/*
        Decorative: the spoken value lives on this `Pressable`'s own
        `accessibilityLabel` above, not on the ring — a nested `progressbar`
        inside a `button` is an invalid ARIA tree on web (`ProgressRing`'s
        own doc comment).
      */}
      <ProgressRing value={module.done_tasks} max={module.total_tasks} size={sizing.moduleCircle} decorative>
        <View
          className={`items-center justify-center rounded-pill px-xs shadow-md shadow-shadow/10 dark:border dark:border-border-dark dark:shadow-none ${
            pressed ? "bg-surface-alt dark:bg-surface-alt-dark" : "bg-surface dark:bg-surface-dark"
          }`}
          style={{ width: discSize, height: discSize }}
        >
          <Text variant="title" numberOfLines={1}>
            {disc}
          </Text>
        </View>
      </ProgressRing>

      <Text variant="caption" className="text-center" numberOfLines={2}>
        {module.title}
      </Text>
    </Pressable>
  );
});
