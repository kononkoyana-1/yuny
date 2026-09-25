import { useState } from "react";
import { Pressable } from "react-native";
import { Text } from "@/shared/ui";
import { FOCUS_RING_CLASS } from "@/shared/ui/focusRing";
import { studyRepository } from "@/shared/repositories";
import { t } from "@/shared/i18n";

/**
 * «Пожаловаться на пример» (решение владельца): корявая фраза или перевод —
 * пример больше не показывается никому, на его место сгенерируется новый.
 * Жалоба идёт по билету задания — только на выданный пример.
 */
export function ReportExample({ taskId }: { taskId: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  if (state === "sent") {
    return (
      <Text variant="caption" tone="muted" accessibilityLiveRegion="polite">
        {t("report.sent")}
      </Text>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={t("report.exampleHint")}
      accessibilityState={{ busy: state === "sending" }}
      disabled={state === "sending"}
      onPress={() => {
        setState("sending");
        studyRepository.reportContext(taskId).then(
          () => setState("sent"),
          () => setState("error"),
        );
      }}
      className={`min-h-tap justify-center self-start rounded-sm ${FOCUS_RING_CLASS}`}
    >
      <Text variant="caption" tone={state === "error" ? "attentionInk" : "muted"} className="underline">
        {state === "error" ? t("report.error") : t("report.example")}
      </Text>
    </Pressable>
  );
}
