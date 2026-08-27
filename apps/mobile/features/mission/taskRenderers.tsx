import type { ReactElement } from "react";
import { Pressable, View } from "react-native";
import type { MissionTask, TaskType } from "@yuny/shared";
import { Input, Text } from "@/shared/ui";
import type { TaskResponseInput } from "@/shared/repositories";

/**
 * Task renderer registry (TZ.md §9's Activity registry pattern, scaled down
 * to the two task types this phase renders). The owning screen
 * (`app/mission/[id]/play.tsx`) is this phase's ActivityShell: it owns
 * progress, the Submit button, submission, and feedback display (TZ.md §9
 * "Разделение ответственности"). A renderer owns only its input widget and
 * reports the current draft answer up through `onChange` — it never submits
 * on its own. Adding a third task type is one new component + one line
 * here, same as the full registry will be later.
 */
export interface TaskRendererProps {
  task: MissionTask;
  value: TaskResponseInput | null;
  onChange: (value: TaskResponseInput) => void;
  disabled?: boolean;
}

export function MultipleChoiceTask({ task, value, onChange, disabled }: TaskRendererProps) {
  if (task.type !== "vocabulary_choice") return null;
  const payload = task.payload as { prompt: string; options: string[] };
  const selectedIndex = value && "selected_index" in value ? value.selected_index : null;

  return (
    <View className="gap-md">
      <Text variant="heading">{payload.prompt}</Text>
      <View className="gap-sm">
        {payload.options.map((option, index) => {
          const isSelected = selectedIndex === index;
          return (
            <Pressable
              key={`${index}-${option}`}
              accessibilityRole="radio"
              accessibilityLabel={option}
              accessibilityState={{ selected: isSelected, disabled }}
              disabled={disabled}
              onPress={() => onChange({ selected_index: index })}
              className={`min-h-[44px] justify-center rounded-md border px-md py-sm ${
                isSelected
                  ? "border-primary bg-primary-soft dark:border-primary-dark dark:bg-primary-soft-dark"
                  : "border-border bg-surface dark:border-border-dark dark:bg-surface-dark"
              } ${disabled ? "opacity-60" : ""}`}
            >
              <Text
                variant="body"
                className={isSelected ? "font-semibold text-primary dark:text-primary-dark" : undefined}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function TextInputTask({ task, value, onChange, disabled }: TaskRendererProps) {
  if (task.type !== "vocabulary_recall") return null;
  const payload = task.payload as { sentence_with_blank: string };
  const text = value && "text" in value ? value.text : "";

  return (
    <View className="gap-md">
      <Text variant="heading">{payload.sentence_with_blank}</Text>
      <Input
        value={text}
        onChangeText={(next) => onChange({ text: next })}
        editable={!disabled}
        placeholder="Type your answer"
        accessibilityLabel="Your answer"
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

export const TASK_RENDERERS: Record<TaskType, (props: TaskRendererProps) => ReactElement | null> = {
  vocabulary_choice: MultipleChoiceTask,
  vocabulary_recall: TextInputTask,
};
