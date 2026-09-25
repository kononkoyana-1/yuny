import { useEffect } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import type { StudySession } from "@yuny/shared";
import { Button, EmptyState, ErrorState, LoadingState } from "@/shared/ui";
import { queryKeys, useFolderPlan, useFolders, useToday } from "@/shared/api";
import { t } from "@/shared/i18n";
import type { StartStudyInput } from "@/shared/repositories";
import { ExerciseShell } from "@/features/study/exercise/ExerciseShell";
import { useStartSession } from "@/features/study/session/useStartSession";
import { useStudySession } from "@/features/study/session/useStudySession";
import { daySummary, portionSummary, roundSummary } from "@/features/study/session/summary";
import { PauseScreen } from "@/features/study/PauseScreen";
import { DaySummaryScreen } from "@/features/study/DaySummaryScreen";
import { RoundSummaryScreen } from "@/features/study/RoundSummaryScreen";

/**
 * Занятие (#67): задания на весь экран, вне таб-бара. `/study` — «Сегодня»,
 * `/study?folder=<id>` — папка. Крестик, Escape и «назад» браузера выходят
 * сразу: ответы уже в очереди отправки (exercise.design.md §3.4).
 */
export default function StudyScreen() {
  const params = useLocalSearchParams<{ folder?: string; minutes?: string; mode?: string; extra?: string }>();
  const router = useRouter();
  const client = useQueryClient();
  const minutes = Number(params.minutes);
  const folderMode = params.mode === "review" || params.mode === "new" || params.mode === "practice" ? params.mode : undefined;
  const input: StartStudyInput = params.folder
    ? { mode: "folder", folder_id: params.folder, ...(folderMode ? { folder_mode: folderMode } : {}) }
    : {
      mode: "today",
      ...(minutes === 5 || minutes === 10 || minutes === 15 ? { minutes } : {}),
      ...(params.extra === "1" ? { extra_new: true } : {}),
    };
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
  return (
    <StudyRun
      key={session.data.session_id}
      session={session.data}
      folderId={params.folder ?? null}
      onClose={close}
      onRestart={(next) => router.replace({ pathname: "/study", params: next })}
    />
  );
}

interface StudyRunProps {
  session: StudySession;
  /** Папка сессии; `null` — «Сегодня» или «Ещё 7 новых» после него. */
  folderId: string | null;
  onClose: () => void;
  /** «Ещё 7 слов» / «Ещё 7 новых слов» — новое занятие вместо этого. */
  onRestart: (params: Record<string, string>) => void;
}

function StudyRun({ session, folderId, onClose, onRestart }: StudyRunProps) {
  const run = useStudySession(session.exercises);
  const client = useQueryClient();
  const today = useToday({ enabled: run.finished });
  const folderPlan = useFolderPlan(run.finished && folderId ? folderId : undefined);
  const folders = useFolders();

  // Прогноз, «Ещё 7» и нагрузка в итоге — из пересчитанных карточки «Сегодня» и плана папки.
  // Ключ сессии (`study/session`) не трогаем: перезапрос собрал бы новое занятие.
  useEffect(() => {
    if (!run.finished) return;
    void client.invalidateQueries({ queryKey: queryKeys.today });
    void client.invalidateQueries({ queryKey: ["study", "folder"] });
  }, [run.finished, client]);

  if (session.exercises.length === 0) {
    // Всё уже сделано (например, на другом устройстве).
    return (
      <View className="flex-1 items-center justify-center gap-lg bg-background p-lg dark:bg-background-dark">
        <EmptyState message={t("learn.day.empty")} />
        <Button label={t("learn.session.toDictionary")} onPress={onClose} />
      </View>
    );
  }

  if (run.finished) {
    const plan = today.data?.plans.find((p) => p.minutes === today.data?.budget_minutes);
    const fresh = today.data && !today.isFetching;
    const tomorrow = fresh && plan ? plan.due_tomorrow : null;

    if (session.folder_mode === "new") {
      // Раунд знакомства: из папки или «Ещё 7 новых» после «Сегодня».
      const folderName = folderId ? (folders.data?.find((f) => f.id === folderId)?.name ?? null) : null;
      const freshPlan = folderPlan.data && !folderPlan.isFetching ? folderPlan.data : null;
      const nextNew = freshPlan ? [freshPlan.primary, ...freshPlan.alternatives].find((o) => o?.mode === "new") : null;
      const extra = fresh ? today.data?.extra_new : null;
      const more = folderId
        ? nextNew?.count
          ? { count: nextNew.count, tomorrowDelta: null }
          : null
        : extra
          ? { count: extra.count, tomorrowDelta: extra.tomorrow_delta }
          : null;
      return (
        <RoundSummaryScreen
          summary={roundSummary(run.log)}
          folderName={folderName}
          loadWarning={freshPlan?.load_warning?.tomorrow_tasks ?? null}
          more={more}
          onMore={() => onRestart(folderId ? { folder: folderId, mode: "new" } : { extra: "1" })}
          onDone={onClose}
        />
      );
    }

    if (session.mode === "folder") {
      const portion = run.log.length ? portionSummaryAll(run.log) : { recalled: 0, answered: 0 };
      return (
        <DaySummaryScreen
          summary={daySummary(run.log)}
          tomorrow={tomorrow}
          title={t("learn.folderReview.title", portion)}
          onDone={onClose}
        />
      );
    }

    const extra = fresh ? today.data?.extra_new : null;
    return (
      <DaySummaryScreen
        summary={daySummary(run.log)}
        tomorrow={tomorrow}
        extraNew={extra ? { count: extra.count, tomorrowDelta: extra.tomorrow_delta, onPress: () => onRestart({ extra: "1" }) } : null}
        onDone={onClose}
      />
    );
  }

  if (run.pause !== null) {
    return (
      <PauseScreen
        portion={run.pause}
        portions={run.portions}
        summary={portionSummary(run.log, run.pause)}
        onNext={run.resume}
        onStop={onClose}
      />
    );
  }

  return <ExerciseShell session={run} onClose={onClose} />;
}

/** «Повторили: N из M» для итога повторения и практики папки — по всем порциям. */
function portionSummaryAll(log: Parameters<typeof portionSummary>[0]) {
  const portions = [...new Set(log.map((a) => a.portion))];
  return portions
    .map((p) => portionSummary(log, p))
    .reduce((acc, s) => ({ recalled: acc.recalled + s.recalled, answered: acc.answered + s.answered }), { recalled: 0, answered: 0 });
}
