import { useEffect } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import type { StudySession } from "@yuny/shared";
import { Button, EmptyState, ErrorState, LoadingState } from "@/shared/ui";
import { queryKeys } from "@/shared/api";
import { t } from "@/shared/i18n";
import type { StartStudyInput } from "@/shared/repositories";
import { ExerciseShell } from "@/features/study/exercise/ExerciseShell";
import { useStartSession } from "@/features/study/session/useStartSession";
import { useStudySession } from "@/features/study/session/useStudySession";

/**
 * Занятие (#67): задания на весь экран, вне таб-бара. `/study` — «Сегодня»,
 * `/study?folder=<id>` — папка. Крестик, Escape и «назад» браузера выходят
 * сразу: ответы уже в очереди отправки (exercise.design.md §3.4).
 */
export default function StudyScreen() {
  const params = useLocalSearchParams<{ folder?: string; minutes?: string }>();
  const router = useRouter();
  const client = useQueryClient();
  const minutes = Number(params.minutes);
  const input: StartStudyInput = params.folder
    ? { mode: "folder", folder_id: params.folder }
    : { mode: "today", ...(minutes === 5 || minutes === 10 || minutes === 15 ? { minutes } : {}) };
  const session = useStartSession(input);

  // Карточка «Сегодня» пересчитается, когда человек вернётся к словарю.
  useEffect(() => () => void client.invalidateQueries({ queryKey: queryKeys.today }), [client]);

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace(params.folder ? { pathname: "/folder/[id]", params: { id: params.folder } } : "/dictionary");
  }

  if (session.isPending) {
    return <LoadingState className="flex-1 bg-background dark:bg-background-dark" message={t("learn.session.loading")} />;
  }
  if (session.isError) {
    return (
      <View className="flex-1 gap-md bg-background p-lg dark:bg-background-dark">
        <ErrorState
          className="flex-1"
          title={t("learn.session.errorTitle")}
          detail={t("learn.session.errorDetail")}
          onRetry={() => void session.refetch()}
          retryLabel={t("learn.session.retry")}
        />
        <Button label={t("learn.session.toDictionary")} variant="ghost" onPress={close} />
      </View>
    );
  }
  return <StudyRun key={session.data.session_id} session={session.data} onClose={close} />;
}

function StudyRun({ session, onClose }: { session: StudySession; onClose: () => void }) {
  const run = useStudySession(session.exercises);

  if (run.finished) {
    // Итог дня с продвинувшимися словами — #68.
    return (
      <View className="flex-1 items-center justify-center gap-lg bg-background p-lg dark:bg-background-dark">
        <EmptyState message={`${t("learn.session.finished")}. ${t("learn.session.finishedDetail")}`} />
        <Button label={t("learn.session.toDictionary")} onPress={onClose} />
      </View>
    );
  }
  return <ExerciseShell session={run} onClose={onClose} />;
}
