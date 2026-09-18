import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { AtmosphericBackground, Button, Mascot, Text } from "@/shared/ui";
import { REQUIRES_AUTH } from "@/shared/config/dataSource";

/**
 * Экран 00 — первый запуск. Имя, короткое обещание, маскот и одно действие.
 *
 * Дальше по новому ТЗ идёт единственный вопрос — уровень HSK (TZ.md §4), —
 * и его экран появится в фазе 7. Пока кнопка ведёт прямо на Главную: вести
 * человека в несуществующий шаг хуже, чем пустить его в приложение.
 *
 * Три точки карусели из референс-макета здесь намеренно не нарисованы: это
 * один экран, а не первый из трёх, и точки обещали бы слайды, которых нет.
 */
export default function Welcome() {
  const router = useRouter();

  return (
    <AtmosphericBackground className="px-lg pb-xl pt-xxl">
      <View className="items-center gap-md pt-xl">
        <Text variant="display" tone="brand" className="text-[52px] leading-[56px]">
          Yuny
        </Text>
        <View className="items-center">
          <Text variant="body" className="text-center font-medium">
            Китайский по вашим
          </Text>
          <Text variant="body" className="text-center font-medium">
            собственным материалам
          </Text>
        </View>
      </View>

      {/* Маскот несёт свои блёстки прямо в ассете, вокруг ничего не рисуем.
          `showStage={false}`: стадии роста больше нет, а пять точек под
          центральной картинкой читались бы как та самая карусель. */}
      <View className="flex-1 items-center justify-center">
        <Mascot decorative stage={1} mood="neutral" size="hero" showStage={false} />
      </View>

      <View className="gap-md">
        <Button
          label="Начать"
          variant="primary"
          className="w-full"
          onPress={() => router.replace("/")}
        />

        {REQUIRES_AUTH ? (
          <View className="flex-row items-center justify-center gap-xs">
            <Text variant="caption" tone="muted">
              Уже есть аккаунт?
            </Text>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Войти"
              onPress={() => router.push("/sign-in")}
              className="min-h-[44px] justify-center px-xs"
            >
              <Text variant="caption" className="font-bold text-primary dark:text-primary-dark">
                Войти
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </AtmosphericBackground>
  );
}
