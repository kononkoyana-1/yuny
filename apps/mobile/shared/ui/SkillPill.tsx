import { View } from "react-native";
import { Text } from "./Text";

export interface SkillPillProps {
  skill: string;
  level?: string;
  className?: string;
}

export function SkillPill({ skill, level, className = "" }: SkillPillProps) {
  return (
    <View
      className={`flex-row items-center gap-xs rounded-pill bg-primary-soft px-sm py-xs dark:bg-primary-soft-dark ${className}`}
    >
      <Text variant="caption" className="text-primary dark:text-primary-dark">
        {skill}
      </Text>
      {level ? (
        <Text variant="caption" tone="muted">
          · {level}
        </Text>
      ) : null}
    </View>
  );
}
