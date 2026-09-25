import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ActionTile,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FeedbackBanner,
  Icon,
  IconButton,
  LoadingState,
  Text,
} from "@/shared/ui";
import { useTheme } from "@/shared/lib/useTheme";
import { t } from "@/shared/i18n";
import { MATERIAL_LIMITS } from "@yuny/shared";
import { useUploadFlowStore } from "@/features/upload/uploadFlow.store";
import { displayNameFor, metaFor, type SelectedFile } from "@/features/upload/selection";
import { formatFileSize } from "@/features/upload/format";
import { WordsReview } from "@/features/upload/WordsReview";

/**
 * Screen 02 «Загрузка» + the parse-wait screen (`docs/design/specs/upload.design.md`).
 * All state lives in `useUploadFlowStore` — this file is render-only, one
 * branch per `FlowPhase`, so switching tabs mid-parse and coming back shows
 * whatever phase the store is actually in (spec §1, Acceptance #16).
 */
export default function UploadTab() {
  const phase = useUploadFlowStore((s) => s.phase);

  if (phase === "selecting") return <SelectingScreen />;
  if (phase === "sending" || phase === "reading") return <WaitingScreen />;
  if (phase === "success") return <SuccessScreen />;
  return <FailedScreen />;
}

function FileRow({ file, files, onRemove }: { file: SelectedFile; files: SelectedFile[]; onRemove: () => void }) {
  const { colors } = useTheme();
  const name = displayNameFor(files, file);
  const meta = metaFor(file);

  return (
    <View className="flex-row items-center gap-md py-sm">
      <View className="rounded-md bg-primary-soft p-sm dark:bg-primary-soft-dark">
        <Icon name={file.kind === "image" ? "image" : "document"} size={22} color={colors.primary} />
      </View>
      {/* One accessible group per row (spec Accessibility table), rather than the name and meta announced as two separate elements. */}
      <View accessible accessibilityLabel={`${name}, ${meta}`} className="flex-1 gap-xs">
        <Text variant="body" className="font-semibold" numberOfLines={1} ellipsizeMode="middle">
          {name}
        </Text>
        <Text variant="caption" tone="muted">
          {meta}
        </Text>
      </View>
      <IconButton icon="close" accessibilityLabel={t("upload.file.remove", { name })} onPress={onRemove} />
    </View>
  );
}

function SelectingScreen() {
  const insets = useSafeAreaInsets();
  const files = useUploadFlowStore((s) => s.files);
  const bannerKey = useUploadFlowStore((s) => s.bannerKey);
  const bannerParams = useUploadFlowStore((s) => s.bannerParams);
  const submitting = useUploadFlowStore((s) => s.submitting);
  const addFromCamera = useUploadFlowStore((s) => s.addFromCamera);
  const addFromGallery = useUploadFlowStore((s) => s.addFromGallery);
  const addFromFiles = useUploadFlowStore((s) => s.addFromFiles);
  const removeFile = useUploadFlowStore((s) => s.removeFile);
  const submit = useUploadFlowStore((s) => s.submit);

  const full = files.length >= MATERIAL_LIMITS.maxFiles;
  const preparing = files.some((f) => f.preparing);
  const totalBytes = files.reduce((sum, f) => sum + f.sizeBytes, 0);

  return (
    <View className="flex-1 bg-background dark:bg-background-dark" style={{ paddingTop: insets.top }}>
      <ScrollView className="flex-1">
        <View className="gap-lg px-lg pt-xl pb-lg">
          <View className="gap-xs">
            <Text variant="title" accessibilityRole="header">
              {t("upload.title")}
            </Text>
            <Text variant="body" tone="muted">
              {t("upload.subtitle")}
            </Text>
          </View>

          <View className="flex-row gap-sm">
            <ActionTile
              className="flex-1"
              icon="camera"
              label={t("upload.source.camera")}
              accessibilityLabel={t("upload.source.cameraA11y")}
              disabled={full}
              onPress={() => void addFromCamera()}
            />
            <ActionTile
              className="flex-1"
              icon="image"
              label={t("upload.source.gallery")}
              accessibilityLabel={t("upload.source.galleryA11y")}
              disabled={full}
              onPress={() => void addFromGallery()}
            />
            <ActionTile
              className="flex-1"
              icon="document"
              label={t("upload.source.files")}
              accessibilityLabel={t("upload.source.filesA11y")}
              disabled={full}
              onPress={() => void addFromFiles()}
            />
          </View>

          <Text variant="caption" tone="muted">
            {t("upload.limits")}
          </Text>

          {bannerKey ? <FeedbackBanner tone="encouraging" message={t(bannerKey, bannerParams)} /> : null}

          {files.length === 0 ? (
            <EmptyState showMascot={false} message={t("upload.empty")} />
          ) : (
            <View className="gap-sm">
              <View className="flex-row justify-between">
                <Text variant="caption" tone="muted">
                  {t("upload.selected.count", { count: files.length })}
                </Text>
                <Text variant="caption" tone="muted">
                  {t("upload.selected.total", { size: formatFileSize(totalBytes) })}
                </Text>
              </View>

              <Card>
                {files.map((file, index) => (
                  <View key={file.id}>
                    {index > 0 ? <View className="h-px bg-border dark:bg-border-dark" /> : null}
                    <FileRow file={file} files={files} onRemove={() => removeFile(file.id)} />
                  </View>
                ))}
              </Card>

              {full ? (
                <Text variant="caption" tone="muted">
                  {t("upload.selected.full")}
                </Text>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>

      <View className="bg-background px-lg pt-sm pb-md dark:bg-background-dark">
        <Button
          label={t("upload.submit")}
          variant="primary"
          disabled={files.length === 0 || preparing}
          loading={submitting}
          onPress={() => void submit()}
        />
      </View>
    </View>
  );
}

const SLOW_THRESHOLD_MS = 30_000;

function WaitingScreen() {
  const phase = useUploadFlowStore((s) => s.phase);
  const cancel = useUploadFlowStore((s) => s.cancel);
  const current = useUploadFlowStore((s) => s.current);
  const total = useUploadFlowStore((s) => s.total);
  const startedAt = useUploadFlowStore((s) => s.startedAt);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (phase !== "reading") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // «Отмена» — в обеих фазах: файл отправляется или читается, человек
  // может передумать, не дожидаясь ни конца, ни ошибки.
  const cancelButton = (
    <View className="items-center pb-xl">
      <Button
        label={t("upload.wait.cancel")}
        variant="ghost"
        accessibilityLabel={t("upload.wait.cancelA11y")}
        onPress={cancel}
      />
    </View>
  );

  if (phase === "sending") {
    return (
      <View className="flex-1">
        <LoadingState
          className="flex-1"
          message={t("upload.wait.sending.title")}
          detail={t("upload.wait.sending.detail", { current, total })}
        />
        {cancelButton}
      </View>
    );
  }

  const slow = startedAt !== null && now - startedAt >= SLOW_THRESHOLD_MS;
  return (
    <View className="flex-1">
      <LoadingState
        className="flex-1"
        message={t("upload.wait.reading.title")}
        detail={slow ? t("upload.wait.reading.slow") : t("upload.wait.reading.detail")}
      />
      {cancelButton}
    </View>
  );
}

/**
 * Слова, найденные в файле (редакция 2026-09-23). «Готово» в любом виде —
 * сохранили, или человек решил загрузить другой файл — сбрасывает поток.
 */
function SuccessScreen() {
  const result = useUploadFlowStore((s) => s.result);
  const reset = useUploadFlowStore((s) => s.reset);

  if (!result) return null;
  return <WordsReview result={result} onDone={reset} />;
}

function FailedScreen() {
  const failureKind = useUploadFlowStore((s) => s.failureKind);
  const retryParse = useUploadFlowStore((s) => s.retryParse);
  const checkAgain = useUploadFlowStore((s) => s.checkAgain);
  const retrySend = useUploadFlowStore((s) => s.retrySend);
  const backToSelecting = useUploadFlowStore((s) => s.backToSelecting);

  switch (failureKind) {
    case "material_rejected":
      return (
        <ErrorState
          className="flex-1"
          title={t("upload.fail.rejected.title")}
          detail={t("upload.fail.rejected.detail")}
          onRetry={backToSelecting}
          retryLabel={t("upload.fail.rejected.action")}
        />
      );
    case "pdf_too_long":
      return (
        <ErrorState
          className="flex-1"
          title={t("upload.fail.pdfTooLong.title")}
          detail={t("upload.fail.pdfTooLong.detail")}
          onRetry={backToSelecting}
          retryLabel={t("upload.fail.pdfTooLong.action")}
        />
      );
    case "parse_failed":
      return (
        <ErrorState
          className="flex-1"
          title={t("upload.fail.parse.title")}
          detail={t("upload.fail.parse.detail")}
          onRetry={() => void retryParse()}
          retryLabel={t("upload.fail.parse.action")}
        />
      );
    case "parse_slow":
      return (
        <ErrorState
          className="flex-1"
          title={t("upload.fail.slow.title")}
          detail={t("upload.fail.slow.detail")}
          onRetry={() => void checkAgain()}
          retryLabel={t("upload.fail.slow.action")}
        />
      );
    case "send_failed":
      return (
        <ErrorState
          className="flex-1"
          title={t("upload.fail.send.title")}
          detail={t("upload.fail.send.detail")}
          onRetry={() => void retrySend()}
          retryLabel={t("upload.fail.send.action")}
          onContinueAnyway={backToSelecting}
          continueLabel={t("upload.fail.send.change")}
        />
      );
    case "lost":
      return (
        <ErrorState
          className="flex-1"
          title={t("upload.fail.lost.title")}
          detail={t("upload.fail.lost.detail")}
          onRetry={backToSelecting}
          retryLabel={t("upload.fail.lost.action")}
        />
      );
    default:
      return null;
  }
}
