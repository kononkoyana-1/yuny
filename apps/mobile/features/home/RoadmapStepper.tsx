import { View } from "react-native";
import type { Roadmap, RoadmapModuleStatus } from "@yuny/shared";
import { Icon, Text } from "@/shared/ui";
import { useTheme } from "@/shared/lib/useTheme";

/**
 * The route to the goal, as a vertical stepper.
 *
 * Strictly read-only, and that is the product decision rather than an
 * unfinished state: TZ.md §7 rejects a lesson catalogue because it competes
 * with "one best next action". Nothing here is a `Pressable`, and if a module
 * ever becomes tappable-to-start, that decision has been reversed.
 *
 * A locked module is a horizon, not a shop window — it says where the plan is
 * heading and offers no way to jump ahead.
 */
const STATUS_COPY: Record<RoadmapModuleStatus, string> = {
  completed: "Completed",
  in_progress: "In progress",
  available: "Next",
  locked: "Upcoming",
};

/**
 * A tick drawn from one View's two borders, rotated. The icon set has no
 * check glyph, and "done" needs to look different in KIND from "upcoming" —
 * showing both as the same coloured pip made a finished module read as just
 * another dot in the rail.
 *
 * `marginTop` compensates for the rotation: the corner, not the box, is what
 * should sit on the centre line.
 */
function Tick() {
  return (
    <View
      className="border-b-2 border-l-2 border-text-inverse dark:border-text-inverse-dark"
      style={{ width: 9, height: 5, marginTop: -3, transform: [{ rotate: "-45deg" }] }}
    />
  );
}

function Dot({ status }: { status: RoadmapModuleStatus }) {
  if (status === "completed") {
    return (
      <View className="h-[26px] w-[26px] items-center justify-center rounded-pill bg-primary dark:bg-primary-dark">
        <Tick />
      </View>
    );
  }
  if (status === "in_progress") {
    return (
      <View className="h-[26px] w-[26px] items-center justify-center rounded-pill border-[2.5px] border-primary bg-surface dark:border-primary-dark dark:bg-surface-dark">
        <View className="h-2 w-2 rounded-pill bg-primary dark:bg-primary-dark" />
      </View>
    );
  }
  return (
    <View className="h-[26px] w-[26px] items-center justify-center rounded-pill bg-surface-alt dark:bg-surface-alt-dark">
      <View className="h-2 w-2 rounded-pill bg-border dark:bg-border-dark" />
    </View>
  );
}

export interface RoadmapStepperProps {
  roadmap: Roadmap;
  /** How many modules to show. The rest stay in the count line below. */
  limit?: number;
}

export function RoadmapStepper({ roadmap, limit = 4 }: RoadmapStepperProps) {
  const { colors } = useTheme();
  const shown = roadmap.modules.slice(0, limit);
  const hidden = roadmap.modules.length - shown.length;

  return (
    <View className="gap-xs">
      {shown.map((module, index) => {
        const isLast = index === shown.length - 1;
        const isMuted = module.status === "locked";
        return (
          <View key={module.id} className="flex-row items-stretch gap-md">
            {/* Rail: the dot, and the line that ties it to the next one. */}
            <View className="items-center">
              <Dot status={module.status} />
              {!isLast ? (
                <View className="min-h-[14px] w-[2px] flex-1 bg-border dark:bg-border-dark" />
              ) : null}
            </View>

            <View className={`flex-1 flex-row items-center gap-sm ${isLast ? "" : "pb-sm"}`}>
              {/* A foundation module teaches the basics the goal rests on, a
                  topic module teaches one theme of it — different glyphs, so
                  the difference is visible without extra copy. */}
              <View
                className={`h-[42px] w-[42px] items-center justify-center rounded-md ${
                  isMuted
                    ? "bg-surface-alt dark:bg-surface-alt-dark"
                    : "bg-primary-soft dark:bg-primary-soft-dark"
                }`}
              >
                <Icon
                  name={module.kind === "foundation" ? "goal" : "library"}
                  size={22}
                  color={isMuted ? colors.textMuted : colors.primary}
                />
              </View>
              <View className="flex-1 gap-[1px]">
                <Text
                  variant="body"
                  className="font-semibold"
                  tone={isMuted ? "muted" : "default"}
                >
                  {module.title}
                </Text>
                {/* Colour comes from `tone`, never from a `text-…` class:
                    both would be emitted and `tone`'s wins, silently. */}
                <Text
                  variant="caption"
                  tone={module.status === "in_progress" ? "brand" : "muted"}
                >
                  {STATUS_COPY[module.status]}
                </Text>
              </View>
            </View>
          </View>
        );
      })}

      {hidden > 0 ? (
        <Text variant="caption" tone="muted" className="pl-[42px]">
          +{hidden} more on the way
        </Text>
      ) : null}
    </View>
  );
}
