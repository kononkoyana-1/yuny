import { Redirect } from "expo-router";

/**
 * `/` — вход в приложение после входа в аккаунт. Главная скрыта с 2026-09-23
 * (код — `features/home/HomeScreen.tsx`): пока загрузка файла нужна только
 * ради слов для своего словаря, приложение открывается на «Загрузке».
 */
export default function IndexRoute() {
  return <Redirect href="/upload" />;
}
